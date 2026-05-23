#!/usr/bin/env ruby
# frozen_string_literal: true

# iPhone 6.7" スクリーンショットを App Store Connect にアップロード
# Usage: ruby scripts/appstore-upload-screenshots.rb --version 1.2.3 --locale ja

require "digest"
require "net/http"
require "optparse"
require "shellwords"
require "uri"

require_relative "asc-client"

options = {
  bundle_id: ENV.fetch("BUNDLE_ID", "jp.tomippe.gradatone"),
  platform: "IOS",
  version: nil,
  locale: "ja",
  display_type: "APP_IPHONE_67",
  width: 1320,
  height: 2868,
  screenshot_dir: nil,
  clear: true
}

DISPLAY_PRESETS = {
  "iphone-67" => { display_type: "APP_IPHONE_67", width: 1320, height: 2868, dir: "ss" },
  "ipad-129" => { display_type: "APP_IPAD_PRO_3GEN_129", width: 2064, height: 2752, dir: "ss/ipad" }
}.freeze

root = File.expand_path("..", __dir__)

OptionParser.new do |opts|
  opts.on("--bundle-id VALUE") { |v| options[:bundle_id] = v }
  opts.on("--version VALUE") { |v| options[:version] = v }
  opts.on("--locale VALUE") { |v| options[:locale] = v }
  opts.on("--dir VALUE") { |v| options[:screenshot_dir] = v }
  opts.on("--preset VALUE", DISPLAY_PRESETS.keys) do |v|
    preset = DISPLAY_PRESETS.fetch(v)
    options.merge!(preset)
    options[:screenshot_dir] ||= File.join(root, preset[:dir])
  end
  opts.on("--display-type VALUE") { |v| options[:display_type] = v }
  opts.on("--width N") { |v| options[:width] = v.to_i }
  opts.on("--height N") { |v| options[:height] = v.to_i }
  opts.on("--no-clear") { options[:clear] = false }
end.parse!

options[:screenshot_dir] ||= File.join(root, "ss")
options[:version] ||= File.read(File.join(root, "version.txt")).strip if File.file?(File.join(root, "version.txt"))

def md5_hex(path)
  Digest::MD5.file(path).hexdigest
end

def verify_dimensions!(path, expected_w, expected_h)
  out = `sips -g pixelWidth -g pixelHeight #{Shellwords.shellescape(path)} 2>/dev/null`
  w = out[/pixelWidth: (\d+)/, 1]&.to_i
  h = out[/pixelHeight: (\d+)/, 1]&.to_i
  return if w == expected_w && h == expected_h

  raise "Screenshot size: expected #{expected_w}x#{expected_h}, got #{w}x#{h} (#{path})"
end

def upload_screenshot(client, set_id, path, sort_order, expected_w, expected_h)
  verify_dimensions!(path, expected_w, expected_h)
  size = File.size(path)
  name = File.basename(path)

  res = client.post(
    "/v1/appScreenshots",
    data: {
      type: "appScreenshots",
      attributes: { fileName: name, fileSize: size },
      relationships: {
        appScreenshotSet: { data: { type: "appScreenshotSets", id: set_id } }
      }
    }
  )
  shot_id = res.fetch("data").fetch("id")
  bytes = File.binread(path)
  (res.dig("data", "attributes", "uploadOperations") || []).each do |op|
    part = bytes.byteslice(op["offset"], op["length"])
    uri = URI(op["url"])
    req = Net::HTTP::Put.new(uri)
    (op["requestHeaders"] || []).each { |h| req[h["name"]] = h["value"] }
    req.body = part
    up = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == "https") { |h| h.request(req) }
    raise "upload PUT failed #{up.code}" unless up.is_a?(Net::HTTPSuccess)
  end

  client.patch(
    "/v1/appScreenshots/#{shot_id}",
    data: {
      type: "appScreenshots",
      id: shot_id,
      attributes: { uploaded: true, sourceFileChecksum: md5_hex(path) }
    }
  )
  wait_complete(client, shot_id)
  puts "  ✓ #{name} (#{sort_order})"
end

def wait_complete(client, shot_id, attempts = 25)
  attempts.times do
    shot = client.get("/v1/appScreenshots/#{shot_id}").fetch("data")
    state = shot.dig("attributes", "assetDeliveryState", "state")
    return if state == "COMPLETE"
    raise "screenshot FAILED: #{shot.dig('attributes', 'assetDeliveryState')}" if state == "FAILED"

    sleep 2
  end
  puts "  ⚠️ still processing #{shot_id}"
end

def find_or_create_set(client, loc_id, display_type)
  sets = client.get("/v1/appStoreVersionLocalizations/#{loc_id}/appScreenshotSets").fetch("data", [])
  found = sets.find { |s| s.dig("attributes", "screenshotDisplayType") == display_type }
  return found.fetch("id") if found

  client.post(
    "/v1/appScreenshotSets",
    data: {
      type: "appScreenshotSets",
      attributes: { screenshotDisplayType: display_type },
      relationships: {
        appStoreVersionLocalization: {
          data: { type: "appStoreVersionLocalizations", id: loc_id }
        }
      }
    }
  ).fetch("data").fetch("id")
end

def clear_set(client, set_id)
  shots = client.get("/v1/appScreenshotSets/#{set_id}/appScreenshots").fetch("data", [])
  shots.each { |shot| client.delete("/v1/appScreenshots/#{shot.fetch('id')}") }
end

def find_version(client, app_id, version_string)
  client.get("/v1/apps/#{app_id}/appStoreVersions", "filter[platform]" => "IOS", "limit" => 50)
    .fetch("data")
    .find { |v| v.dig("attributes", "versionString") == version_string }
end

def localization_for(client, version_id, locale)
  locs = client.get("/v1/appStoreVersions/#{version_id}/appStoreVersionLocalizations").fetch("data", [])
  found = locs.find { |l| l.dig("attributes", "locale") == locale }
  return found if found

  client.post(
    "/v1/appStoreVersionLocalizations",
    data: {
      type: "appStoreVersionLocalizations",
      attributes: { locale: locale },
      relationships: {
        appStoreVersion: { data: { type: "appStoreVersions", id: version_id } }
      }
    }
  ).fetch("data")
end

client = asc_client
app = client.get("/v1/apps", "filter[bundleId]" => options[:bundle_id], "limit" => 1).fetch("data").first
abort "app not found: #{options[:bundle_id]}" unless app

version = find_version(client, app.fetch("id"), options[:version])
abort "version not found: #{options[:version]}" unless version

version_id = version.fetch("id")
loc = localization_for(client, version_id, options[:locale])
loc_id = loc.fetch("id")

files = Dir.children(options[:screenshot_dir]).map do |name|
  next unless name.match?(/\A\d+\.(png|jpe?g)\z/i)

  File.join(options[:screenshot_dir], name)
end.compact.sort.uniq
abort "no screenshots in #{options[:screenshot_dir]}" if files.empty?

puts "Screenshots: #{options[:version]} / #{options[:locale]} / #{options[:display_type]} (#{files.size} files)"

set_id = find_or_create_set(client, loc_id, options[:display_type])
clear_set(client, set_id) if options[:clear]

files.each_with_index do |path, idx|
  upload_screenshot(client, set_id, path, idx + 1, options[:width], options[:height])
end

puts "✅ #{files.size} screenshot(s) uploaded"
