#!/usr/bin/env ruby
# frozen_string_literal: true

# App Store: アプリ本体を無料に設定（ベース地域 JPN）
# Usage: ruby scripts/appstore-set-app-free.rb

require "base64"
require "json"

require_relative "asc-client"

app_id = ENV.fetch("ASC_APP_ID", "6772448588")
base_territory = ENV.fetch("ASC_BASE_TERRITORY", "JPN")

client = asc_client
today = Time.now.utc.strftime("%Y-%m-%d")

def find_free_price_point(client, app_id, territory)
  points = client.get(
    "/v1/apps/#{app_id}/appPricePoints",
    "filter[territory]" => territory,
    "limit" => 200
  ).fetch("data", [])

  match = points.find do |pt|
    cp = pt.dig("attributes", "customerPrice")
    cp.to_s == "0" || cp.to_f.zero?
  end
  abort "❌ #{territory} の無料 price point が見つかりません" unless match

  match.fetch("id")
end

def active_manual_prices(client, app_id)
  sched = client.get("/v1/apps/#{app_id}/appPriceSchedule", "include" => "manualPrices")
  (sched["included"] || []).select { |i| i["type"] == "appPrices" && i.dig("attributes", "endDate").nil? }
end

free_pp = find_free_price_point(client, app_id, base_territory)
active = active_manual_prices(client, app_id)

if active.empty?
  begin
    client.get("/v1/apps/#{app_id}/appPriceSchedule")
    puts "✅ 価格スケジュールは既に存在します（無料の可能性あり）"
    exit 0
  rescue RuntimeError
    # fall through to create
  end
end

all_points = client.get(
  "/v1/apps/#{app_id}/appPricePoints",
  "filter[territory]" => base_territory,
  "limit" => 200
).fetch("data", [])

included = []
manual_refs = []

active.each do |price_row|
  decoded = JSON.parse(Base64.urlsafe_decode64(price_row["id"] + "==" * ((4 - price_row["id"].length % 4) % 4)))
  pp_id = decoded["p"]
  current_pp = all_points.find { |pt| pt["id"].include?("\"p\":\"#{pp_id}\"") || pt["id"].end_with?(pp_id) }
  next unless current_pp
  next if current_pp["id"] == free_pp

  cp = current_pp.dig("attributes", "customerPrice")
  puts "   現行 #{cp} → #{today} で終了"
  included << {
    type: "appPrices",
    id: "${old-price}",
    attributes: { startDate: nil, endDate: today },
    relationships: { appPricePoint: { data: { type: "appPricePoints", id: current_pp["id"] } } }
  }
  manual_refs << { type: "appPrices", id: "${old-price}" }
end

if manual_refs.empty? && !active.empty?
  puts "✅ 既に無料です（App #{app_id}）"
  exit 0
end

included << {
  type: "appPrices",
  id: "${new-free}",
  attributes: { startDate: today, endDate: nil },
  relationships: { appPricePoint: { data: { type: "appPricePoints", id: free_pp } } }
}
manual_refs << { type: "appPrices", id: "${new-free}" }

puts "📦 App #{app_id} / base #{base_territory}"

client.post(
  "/v1/appPriceSchedules",
  data: {
    type: "appPriceSchedules",
    relationships: {
      app: { data: { type: "apps", id: app_id } },
      baseTerritory: { data: { type: "territories", id: base_territory } },
      manualPrices: { data: manual_refs }
    }
  },
  included: included
)
puts "✅ #{today} から無料に設定しました"
