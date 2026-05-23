#!/usr/bin/env ruby
# frozen_string_literal: true

require "optparse"

require_relative "asc-client"
require_relative "store-locales"

options = {
  bundle_id: ENV.fetch("BUNDLE_ID", "jp.tomippe.gradatone"),
  version: nil,
  privacy_policy_url: "https://apps.tomippe.jp/gradatone/policy/",
  copyright: "Copyright © 2026 tomippe. All rights reserved.",
  upload_ipad_screenshots: false,
  locales: %w[ja en-US zh-Hans]
}

OptionParser.new do |opts|
  opts.on("--bundle-id VALUE") { |v| options[:bundle_id] = v }
  opts.on("--version VALUE") { |v| options[:version] = v }
  opts.on("--ipad-screenshots") { options[:upload_ipad_screenshots] = true }
  opts.on("--no-ipad-screenshots") { options[:upload_ipad_screenshots] = false }
end.parse!

client = asc_client
app = client.get("/v1/apps", "filter[bundleId]" => options[:bundle_id], "limit" => 1).fetch("data").first
abort "app not found" unless app

app_id = app.fetch("id")
infos = client.get("/v1/apps/#{app_id}/appInfos", "limit" => 10).fetch("data")
info = infos.find { |item| item.dig("attributes", "appStoreState") == "PREPARE_FOR_SUBMISSION" } ||
       infos.find { |item| item.dig("attributes", "appStoreState") == "READY_FOR_SALE" } ||
       infos.first
abort "appInfo not found" unless info

info_id = info.fetch("id")
ar_id = info_id

def patch_age_rating(client, ar_id)
  attrs = {
    alcoholTobaccoOrDrugUseOrReferences: "NONE",
    contests: "NONE",
    gambling: false,
    gamblingSimulated: "NONE",
    gunsOrOtherWeapons: "NONE",
    lootBox: false,
    profanityOrCrudeHumor: "NONE",
    sexualContentGraphicAndNudity: "NONE",
    sexualContentOrNudity: "NONE",
    horrorOrFearThemes: "NONE",
    matureOrSuggestiveThemes: "NONE",
    violenceCartoonOrFantasy: "NONE",
    violenceRealistic: "NONE",
    violenceRealisticProlongedGraphicOrSadistic: "NONE",
    unrestrictedWebAccess: false,
    userGeneratedContent: false,
    advertising: false,
    messagingAndChat: false,
    parentalControls: false,
    medicalOrTreatmentInformation: "NONE",
    healthOrWellnessTopics: false,
    ageAssurance: false
  }
  client.patch(
    "/v1/ageRatingDeclarations/#{ar_id}",
    data: { type: "ageRatingDeclarations", id: ar_id, attributes: attrs }
  )
end

puts "App: #{options[:bundle_id]} (#{app_id})"
puts "AppInfo: #{info_id}"

client.patch(
  "/v1/apps/#{app_id}",
  data: {
    type: "apps",
    id: app_id,
    attributes: { contentRightsDeclaration: "DOES_NOT_USE_THIRD_PARTY_CONTENT" }
  }
)
puts "  ✓ content rights: third-party content なし"

patch_age_rating(client, ar_id)
rating = client.get("/v1/appInfos/#{info_id}").dig("data", "attributes", "appStoreAgeRating")
puts "  ✓ age rating: #{rating}"

client.patch(
  "/v1/appInfos/#{info_id}",
  data: {
    type: "appInfos",
    id: info_id,
    relationships: {
      primaryCategory: { data: { type: "appCategories", id: "MUSIC" } }
    }
  }
)
puts "  ✓ category: Music"

info_locs = client.get("/v1/appInfos/#{info_id}/appInfoLocalizations", "limit" => 50).fetch("data")
info_locs.each do |loc|
  locale = loc.dig("attributes", "locale")
  meta = STORE_LOCALES[locale]
  attrs = { privacyPolicyUrl: options[:privacy_policy_url] }
  attrs[:subtitle] = meta[:subtitle] if meta&.dig(:subtitle)
  begin
    client.patch(
      "/v1/appInfoLocalizations/#{loc.fetch('id')}",
      data: {
        type: "appInfoLocalizations",
        id: loc.fetch("id"),
        attributes: attrs
      }
    )
    puts "  ✓ app info (#{locale}): privacy URL#{meta ? ', subtitle' : ''}"
  rescue RuntimeError => e
    puts "  ⚠️ app info skipped (#{locale}): #{e.message.lines.first}"
  end
end

STORE_LOCALES.each do |locale, meta|
  next if info_locs.any? { |loc| loc.dig("attributes", "locale") == locale }

  client.post(
    "/v1/appInfoLocalizations",
    data: {
      type: "appInfoLocalizations",
      attributes: {
        locale: locale,
        name: meta[:title],
        subtitle: meta[:subtitle],
        privacyPolicyUrl: options[:privacy_policy_url]
      },
      relationships: { appInfo: { data: { type: "appInfos", id: info_id } } }
    }
  )
  puts "  ✓ app info localization created: #{locale}"
rescue RuntimeError => e
  puts "  ⚠️ app info create skipped (#{locale}): #{e.message.lines.first}"
end

version_string = options[:version]
if version_string.to_s.empty?
  versions = client.get("/v1/apps/#{app_id}/appStoreVersions", "filter[platform]" => "IOS", "limit" => 20).fetch("data")
  version_string = versions.map { |item| item.dig("attributes", "versionString") }.compact.max
end

if version_string.to_s.empty?
  version_file = File.expand_path("../version.txt", __dir__)
  version_string = File.read(version_file).strip if File.file?(version_file)
end

EDITABLE_STATES = %w[
  PREPARE_FOR_SUBMISSION DEVELOPER_REJECTED METADATA_REJECTED REJECTED
  WAITING_FOR_REVIEW IN_REVIEW
].freeze

versions = client.get("/v1/apps/#{app_id}/appStoreVersions", "filter[platform]" => "IOS", "limit" => 50).fetch("data")
version = versions.find { |item| item.dig("attributes", "versionString") == version_string }
version ||= versions.find { |item| EDITABLE_STATES.include?(item.dig("attributes", "appStoreState")) }

unless version
  begin
    version = client.post(
      "/v1/appStoreVersions",
      data: {
        type: "appStoreVersions",
        attributes: { platform: "IOS", versionString: version_string },
        relationships: { app: { data: { type: "apps", id: app_id } } }
      }
    ).fetch("data")
    puts "  ✓ created iOS version #{version_string}"
  rescue RuntimeError => e
    abort e.message unless e.message.include?("409")

    version = versions.find { |item| EDITABLE_STATES.include?(item.dig("attributes", "appStoreState")) }
    abort "editable iOS version not found after 409" unless version
    puts "  ℹ️ 既存バージョンを使用: #{version.dig('attributes', 'versionString')}"
  end
end

current_vs = version.dig("attributes", "versionString")
if version_string && current_vs != version_string
  version = client.patch(
    "/v1/appStoreVersions/#{version.fetch('id')}",
    data: {
      type: "appStoreVersions",
      id: version.fetch("id"),
      attributes: { versionString: version_string }
    }
  ).fetch("data")
  puts "  ✓ versionString: #{current_vs} → #{version_string}"
end

version_id = version.fetch("id")
client.patch(
  "/v1/appStoreVersions/#{version_id}",
  data: {
    type: "appStoreVersions",
    id: version_id,
    attributes: { copyright: options[:copyright] }
  }
)
puts "  ✓ copyright on version #{version_string}"

free_pp = client.get(
  "/v1/apps/#{app_id}/appPricePoints",
  "filter[territory]" => "JPN",
  "limit" => 1
).fetch("data").first&.fetch("id")

if free_pp
  begin
    client.get("/v1/appPriceSchedules/#{app_id}")
    puts "  ✓ price schedule: already exists"
  rescue RuntimeError
    client.post(
      "/v1/appPriceSchedules",
      {
        data: {
          type: "appPriceSchedules",
          relationships: {
            app: { data: { type: "apps", id: app_id } },
            baseTerritory: { data: { type: "territories", id: "JPN" } },
            manualPrices: { data: [{ type: "appPrices", id: "${price-free}" }] }
          }
        },
        included: [
          {
            id: "${price-free}",
            type: "appPrices",
            attributes: { startDate: nil },
            relationships: {
              appPricePoint: { data: { type: "appPricePoints", id: free_pp } }
            }
          }
        ]
      }
    )
    puts "  ✓ price: 無料（JPN 基準）"
  end
else
  puts "  ⚠️ price points not found — Connect の「価格」で無料を選択"
end

if options[:upload_ipad_screenshots]
  options[:locales].each do |locale|
    system(
      "ruby", File.expand_path("appstore-upload-screenshots.rb", __dir__),
      "--version", version_string,
      "--locale", locale,
      "--ipad-13"
    ) || abort("iPad screenshot upload failed: #{locale}")
    puts "  ✓ iPad screenshots: #{locale}"
  end
end

puts ""
puts "⚠️ API 非対応（Admin が Connect Web で実施）:"
puts "  - アプリのプライバシー → データ収集「いいえ」等（個人データを収集しない）"
puts "  - 審査提出 → 初回 IPA 後に appstore-prepare-and-submit.rb --submit"
puts "完了。バージョン #{version_string} のアプリ情報を確認してください。"
