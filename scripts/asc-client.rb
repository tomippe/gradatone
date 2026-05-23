# frozen_string_literal: true

require "base64"
require "digest"
require "json"
require "net/http"
require "openssl"
require "uri"

def load_env_file(path)
  expanded = File.expand_path(path)
  return unless File.file?(expanded)

  File.foreach(expanded) do |line|
    next if line.strip.empty? || line.lstrip.start_with?("#")

    key, value = line.strip.split("=", 2)
    next if key.to_s.empty? || value.nil? || ENV.key?(key)

    ENV[key] = value.gsub(/\A['"]|['"]\z/, "")
  end
end

def load_asc_env
  load_env_file("~/.apple-env")
  load_env_file(File.expand_path("../.env", __dir__))
end

def apple_private_keys_dir
  File.expand_path(ENV.fetch("APPLE_PRIVATE_KEYS_DIR", "~/.apple/private_keys"))
end

def first_present(*values)
  values.find { |value| !value.to_s.empty? }
end

def asc_credentials
  key_id = first_present(
    ENV["APP_STORE_CONNECT_API_KEY_KEY_ID"],
    ENV["APP_STORE_CONNECT_API_KEY_ID"],
    ENV["ASC_KEY_ID"]
  )
  issuer_id = first_present(
    ENV["APP_STORE_CONNECT_API_KEY_ISSUER_ID"],
    ENV["APP_STORE_CONNECT_ISSUER_ID"],
    ENV["ASC_ISSUER_ID"]
  )
  key_path = first_present(
    ENV["APP_STORE_CONNECT_API_KEY_KEY_FILEPATH"],
    ENV["APP_STORE_CONNECT_API_KEY_PATH"],
    ENV["ASC_KEY_PATH"]
  )

  if key_path.to_s.empty? && !key_id.to_s.empty?
    candidates = [
      File.join(apple_private_keys_dir, "AuthKey_#{key_id}.p8"),
      File.expand_path("~/.private_keys/AuthKey_#{key_id}.p8"),
      File.expand_path("~/private_keys/AuthKey_#{key_id}.p8"),
      File.expand_path("~/.appstoreconnect/private_keys/AuthKey_#{key_id}.p8")
    ]
    key_path = candidates.find { |path| File.file?(path) }
  end

  private_key_text = first_present(
    ENV["APP_STORE_CONNECT_API_KEY_KEY"],
    ENV["APP_STORE_CONNECT_API_PRIVATE_KEY"],
    ENV["ASC_PRIVATE_KEY"]
  )
  private_key_text = private_key_text&.gsub("\\n", "\n")
  private_key_text = File.read(File.expand_path(key_path)) if private_key_text.to_s.empty? && !key_path.to_s.empty?

  raise "App Store Connect API key is not configured" if key_id.to_s.empty? || issuer_id.to_s.empty? || private_key_text.to_s.empty?

  [key_id, issuer_id, private_key_text]
end

def b64url(data)
  Base64.urlsafe_encode64(data).delete("=")
end

def jwt_token(key_id, issuer_id, private_key_text)
  private_key = OpenSSL::PKey.read(private_key_text)
  now = Time.now.to_i
  header = { alg: "ES256", kid: key_id, typ: "JWT" }
  payload = { iss: issuer_id, iat: now, exp: now + 20 * 60, aud: "appstoreconnect-v1" }
  signing_input = "#{b64url(header.to_json)}.#{b64url(payload.to_json)}"
  der_signature = private_key.dsa_sign_asn1(Digest::SHA256.digest(signing_input))
  sequence = OpenSSL::ASN1.decode(der_signature)
  signature = sequence.value.map do |integer|
    [integer.value.to_s(16).rjust(64, "0")].pack("H*")
  end.join
  "#{signing_input}.#{b64url(signature)}"
end

class AppStoreConnectClient
  API_ROOT = "https://api.appstoreconnect.apple.com"

  def initialize(token)
    @token = token
  end

  def get(path, params = {})
    request(:get, path, params: params)
  end

  def post(path, body)
    request(:post, path, body: body)
  end

  def patch(path, body)
    request(:patch, path, body: body)
  end

  def delete(path)
    request(:delete, path)
  end

  def upload_binary(url, data, headers)
    uri = URI(url)
    req = Net::HTTP::Put.new(uri)
    headers.each { |key, value| req[key] = value }
    req.body = data
    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == "https") { |http| http.request(req) }
    return if response.is_a?(Net::HTTPSuccess)

    raise "Screenshot upload failed #{response.code}: #{response.body}"
  end

  private

  def request(method, path, params: {}, body: nil)
    uri = URI("#{API_ROOT}#{path}")
    uri.query = URI.encode_www_form(params) unless params.empty?
    klass = { get: Net::HTTP::Get, post: Net::HTTP::Post, patch: Net::HTTP::Patch, delete: Net::HTTP::Delete }.fetch(method)
    req = klass.new(uri)
    req["Authorization"] = "Bearer #{@token}"
    req["Content-Type"] = "application/json"
    req.body = JSON.generate(body) if body

    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
    parsed = response.body.to_s.empty? ? {} : JSON.parse(response.body)
    return parsed if response.is_a?(Net::HTTPSuccess)

    detail = parsed.dig("errors", 0, "detail") || parsed.dig("errors", 0, "title") || response.body
    raise "App Store Connect API #{response.code}: #{detail}"
  end
end

def asc_client
  load_asc_env
  key_id, issuer_id, private_key_text = asc_credentials
  AppStoreConnectClient.new(jwt_token(key_id, issuer_id, private_key_text))
end
