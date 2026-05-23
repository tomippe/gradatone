#!/usr/bin/env ruby
# frozen_string_literal: true

require "optparse"
require_relative "asc-client"

options = { bundle_id: ENV.fetch("BUNDLE_ID", "jp.tomippe.gradatone") }

OptionParser.new do |opts|
  opts.on("--bundle-id VALUE") { |v| options[:bundle_id] = v }
end.parse!

client = asc_client
app = client.get("/v1/apps", "filter[bundleId]" => options[:bundle_id], "limit" => 1).fetch("data").first
abort "app not found: #{options[:bundle_id]}" unless app

app_id = app.fetch("id")
all_territory_codes = client.get("/v1/territories", "limit" => 200).fetch("data").map { |t| t.fetch("id") }.sort
abort "territories list empty" if all_territory_codes.empty?

def fetch_territory_availabilities(client, availability_id)
  items = []
  cursor = nil
  loop do
    params = { "limit" => 200, "include" => "territory" }
    params["cursor"] = cursor if cursor
    response = client.get(
      "/v2/appAvailabilities/#{availability_id}/territoryAvailabilities",
      params
    )
    items.concat(response.fetch("data"))
    cursor = response.dig("meta", "paging", "nextCursor")
    break if cursor.to_s.empty?
  end
  items
end

def create_all_territories(client, app_id, territory_codes)
  included = territory_codes.map do |code|
    {
      type: "territoryAvailabilities",
      id: "${ta-#{code}}",
      attributes: { available: true },
      relationships: {
        territory: { data: { type: "territories", id: code } }
      }
    }
  end

  client.post(
    "/v2/appAvailabilities",
    data: {
      type: "appAvailabilities",
      attributes: { availableInNewTerritories: true },
      relationships: {
        app: { data: { type: "apps", id: app_id } },
        territoryAvailabilities: {
          data: territory_codes.map { |code| { type: "territoryAvailabilities", id: "${ta-#{code}}" } }
        }
      }
    },
    included: included
  )
end

def availability_id_for_app(client, app_id)
  linkage = client.get("/v1/apps/#{app_id}/relationships/appAvailabilityV2").fetch("data")
  linkage&.fetch("id")
rescue RuntimeError => e
  return nil if e.message.include?("404")

  raise
end

puts "App: #{options[:bundle_id]} (#{app_id})"
puts "  territories (App Store): #{all_territory_codes.size}"

availability_id = availability_id_for_app(client, app_id)

if availability_id.to_s.empty?
  create_all_territories(client, app_id, all_territory_codes)
  puts "  ✓ appAvailability 作成（全 #{all_territory_codes.size} か国・地域を配信対象）"
  puts "  ✓ availableInNewTerritories: true"
  exit 0
end

existing = fetch_territory_availabilities(client, availability_id)
by_territory = {}
existing.each do |item|
  code = item.dig("relationships", "territory", "data", "id")
  next if code.to_s.empty?

  by_territory[code] = item
end

enabled = by_territory.values.count { |item| item.dig("attributes", "available") }
puts "  appAvailability: #{availability_id}（登録 #{existing.size} / 配信ON #{enabled}）"

patched = 0
all_territory_codes.each do |code|
  item = by_territory[code]
  next unless item
  next if item.dig("attributes", "available")

  ta_id = item.fetch("id")
  client.patch(
    "/v1/territoryAvailabilities/#{ta_id}",
    data: {
      type: "territoryAvailabilities",
      id: ta_id,
      attributes: { available: true }
    }
  )
  patched += 1
end

missing_codes = all_territory_codes - by_territory.keys
if missing_codes.any?
  abort(
    "配信地域レコードが #{missing_codes.size} 件不足しています（API で新規追加不可）。" \
    "Connect で一度保存するか、Apple サポートへ問い合わせてください。不足例: #{missing_codes.first(5).join(', ')}"
  )
end

if patched.positive?
  puts "  ✓ 配信OFF → ON に更新: #{patched} か国・地域"
else
  puts "  ✓ 全 #{all_territory_codes.size} か国・地域がすでに配信ON"
end

info = client.get("/v2/appAvailabilities/#{availability_id}").fetch("data")
if info.dig("attributes", "availableInNewTerritories")
  puts "  ✓ availableInNewTerritories: true"
else
  puts "  ⚠️ availableInNewTerritories が false（v2 appAvailabilities は PATCH 不可のため Connect で確認）"
end

puts "✅ 配信する国または地域の API 反映完了"
