#!/usr/bin/env ruby
# frozen_string_literal: true

require "json"
require "optparse"

require_relative "asc-client"

options = {
  bundle_id: ENV.fetch("BUNDLE_ID", "jp.tomippe.gradatone"),
  platform: "IOS",
  version: nil,
  build_number: nil,
  submit: false,
  metadata_only: false,
  locales: {
    "ja" => {
      description: <<~TEXT.strip,
        Gradatone は、画面をスワイプするだけで音程が滑らかに変化するシームレスなピッチ楽器です。従来の鍵盤では難しい連続的なグリッサンドや、微妙なニュアンスの表現が可能です。

        複数の楽器レイヤーを重ねて豊かなハーモニーを作ったり、Snap をオンにして音階に寄せたりできます。ピアノ、弦楽器、シンセ、民族楽器など多数の音色を内蔵しています。

        アカウント登録、広告、課金、トラッキングはありません。設定は端末内に保存されます。iOS アプリ版では消音スイッチがオンのままでも演奏できます（音量は端末のボタンで調整）。
      TEXT
      keywords: "楽器,ピアノ,グリッサンド,音楽,演奏,シンセ,タッチ,音階,メロディ,gradatone",
      promotionalText: "スワイプで音程が流れる。鍵盤のない、無限音階のタッチ楽器。",
      whatsNew: "App Store 版の初回リリース準備。",
      supportUrl: "https://apps.tomippe.jp/gradatone/"
    },
    "en-US" => {
      description: <<~TEXT.strip,
        Gradatone is a seamless pitch instrument: swipe the screen and hear notes glide smoothly—glissandos and microtonal nuance that traditional keyboards cannot offer.

        Layer multiple instrument sounds, enable Snap to pull pitches toward scales, and explore pianos, strings, synths, and more. No account, ads, in-app purchases, or tracking. Settings stay on your device.

        On the iOS app, you can play even when the Ring/Silent switch is on (adjust loudness with the device volume buttons).
      TEXT
      keywords: "instrument,piano,glissando,music,play,synth,touch,scale,melody,gradatone",
      promotionalText: "Swipe to bend pitch. A touch instrument beyond the keyboard.",
      whatsNew: "Initial App Store release preparation.",
      supportUrl: "https://apps.tomippe.jp/gradatone/"
    },
    "zh-Hans" => {
      description: <<~TEXT.strip,
        Gradatone 是一款无缝音高乐器：在屏幕上滑动即可让音高平滑变化，实现传统键盘难以做到的滑音与细微音程表现。

        可叠加多种乐器音色，开启 Snap 将音高吸附到音阶，并探索钢琴、弦乐、合成器等音色。无需账号、广告、内购或追踪，设置保存在设备内。

        iOS 应用版在静音开关开启时也可演奏（请用设备音量键调节响度）。
      TEXT
      keywords: "乐器,钢琴,滑音,音乐,演奏,合成器,触摸,音阶,旋律,gradatone",
      promotionalText: "滑动改变音高。超越键盘的触摸乐器。",
      whatsNew: "App Store 版首次发布准备。",
      supportUrl: "https://apps.tomippe.jp/gradatone/"
    }
  }
}

OptionParser.new do |opts|
  opts.on("--bundle-id VALUE") { |v| options[:bundle_id] = v }
  opts.on("--platform VALUE") { |v| options[:platform] = v }
  opts.on("--version VALUE") { |v| options[:version] = v }
  opts.on("--build-number VALUE") { |v| options[:build_number] = v }
  opts.on("--submit") { options[:submit] = true }
  opts.on("--metadata-only") { options[:metadata_only] = true }
end.parse!

EDITABLE_STATES = %w[
  PREPARE_FOR_SUBMISSION DEVELOPER_REJECTED METADATA_REJECTED REJECTED
  WAITING_FOR_REVIEW IN_REVIEW
].freeze

def list_versions(client, app_id, platform)
  client.get(
    "/v1/apps/#{app_id}/appStoreVersions",
    "filter[platform]" => platform,
    "limit" => 50
  ).fetch("data")
end

def ensure_version(client, app_id, platform, version_string)
  versions = list_versions(client, app_id, platform)
  match = versions.find { |item| item.dig("attributes", "versionString") == version_string }
  return match if match

  client.post(
    "/v1/appStoreVersions",
    data: {
      type: "appStoreVersions",
      attributes: { platform: platform, versionString: version_string },
      relationships: { app: { data: { type: "apps", id: app_id } } }
    }
  ).fetch("data")
end

def find_editable_version(client, app_id, platform, version_string = nil)
  versions = list_versions(client, app_id, platform)

  if version_string
    match = versions.find { |item| item.dig("attributes", "versionString") == version_string }
    return match if match

    editable = versions.find { |item| EDITABLE_STATES.include?(item.dig("attributes", "appStoreState")) }
    return editable if editable

    return ensure_version(client, app_id, platform, version_string)
  end

  versions.find { |item| EDITABLE_STATES.include?(item.dig("attributes", "appStoreState")) } ||
    versions.max_by { |item| item.dig("attributes", "versionString").to_s }
end

def find_localization(client, version_id, locale)
  client.get(
    "/v1/appStoreVersions/#{version_id}/appStoreVersionLocalizations",
    "limit" => 200
  ).fetch("data").find { |item| item.dig("attributes", "locale") == locale }
end

def upsert_localization(client, version_id, locale, attrs)
  localization = find_localization(client, version_id, locale)
  payload_attrs = attrs.dup

  save = lambda do |attributes|
    if localization
      client.patch(
        "/v1/appStoreVersionLocalizations/#{localization.fetch("id")}",
        data: {
          type: "appStoreVersionLocalizations",
          id: localization.fetch("id"),
          attributes: attributes
        }
      )
      localization.fetch("id")
    else
      client.post(
        "/v1/appStoreVersionLocalizations",
        data: {
          type: "appStoreVersionLocalizations",
          attributes: attributes.merge(locale: locale),
          relationships: {
            appStoreVersion: { data: { type: "appStoreVersions", id: version_id } }
          }
        }
      ).fetch("data").fetch("id")
    end
  end

  begin
    save.call(payload_attrs)
  rescue RuntimeError => e
    raise e unless e.message.include?("whatsNew") && payload_attrs.key?(:whatsNew)

    puts "  ⚠️ whatsNew はスキップしました (#{locale})"
    payload_attrs.delete(:whatsNew)
    save.call(payload_attrs)
  end
end

def latest_build(client, app_id, platform, _version_string = nil, build_number = nil)
  params = {
    "filter[app]" => app_id,
    "sort" => "-uploadedDate",
    "limit" => 50
  }

  builds = client.get("/v1/builds", params).fetch("data")
  platform_builds = builds.select do |item|
    next false unless item.dig("attributes", "processingState") == "VALID"

    pr = client.get("/v1/builds/#{item.fetch('id')}/preReleaseVersion").fetch("data")
    pr.dig("attributes", "platform") == platform
  rescue StandardError
    false
  end

  if build_number
    match = platform_builds.find { |item| item.dig("attributes", "version") == build_number.to_s }
    return match if match
  end
  platform_builds.first
end

def attach_build(client, version_id, build_id)
  client.patch(
    "/v1/appStoreVersions/#{version_id}",
    data: {
      type: "appStoreVersions",
      id: version_id,
      relationships: {
        build: { data: { type: "builds", id: build_id } }
      }
    }
  )
end

def set_export_compliance(client, build_id)
  client.patch(
    "/v1/builds/#{build_id}",
    data: {
      type: "builds",
      id: build_id,
      attributes: {
        usesNonExemptEncryption: false
      }
    }
  )
rescue StandardError => e
  puts "  ⚠️ export compliance update skipped: #{e.message}"
end

def submit_version(client, app_id, version_id, platform = "IOS")
  submission = client.post(
    "/v1/reviewSubmissions",
    data: {
      type: "reviewSubmissions",
      attributes: { platform: platform },
      relationships: {
        app: { data: { type: "apps", id: app_id } }
      }
    }
  ).fetch("data")

  submission_id = submission.fetch("id")
  client.post(
    "/v1/reviewSubmissionItems",
    data: {
      type: "reviewSubmissionItems",
      relationships: {
        reviewSubmission: { data: { type: "reviewSubmissions", id: submission_id } },
        appStoreVersion: { data: { type: "appStoreVersions", id: version_id } }
      }
    }
  )
  client.patch(
    "/v1/reviewSubmissions/#{submission_id}",
    data: {
      type: "reviewSubmissions",
      id: submission_id,
      attributes: { submitted: true }
    }
  )
end

client = asc_client
app = client.get("/v1/apps", "filter[bundleId]" => options[:bundle_id], "limit" => 1).fetch("data").first
abort "app not found: #{options[:bundle_id]}" unless app

app_id = app.fetch("id")
target_version_string = options[:version]
if target_version_string.to_s.empty?
  version_file = File.expand_path("../version.txt", __dir__)
  target_version_string = File.read(version_file).strip if File.file?(version_file)
end

version = find_editable_version(client, app_id, options[:platform], options[:version])
abort "app store version not found" unless version

version_id = version.fetch("id")
current_version_string = version.dig("attributes", "versionString")
state = version.dig("attributes", "appStoreState")

if target_version_string && current_version_string != target_version_string
  version = client.patch(
    "/v1/appStoreVersions/#{version_id}",
    data: {
      type: "appStoreVersions",
      id: version_id,
      attributes: { versionString: target_version_string }
    }
  ).fetch("data")
  puts "  ✓ versionString: #{current_version_string} → #{target_version_string}"
  version_string = target_version_string
else
  version_string = current_version_string
end

puts "App: #{options[:bundle_id]}"
puts "Version: #{version_string} (#{state})"

options[:locales].each do |locale, attrs|
  upsert_localization(client, version_id, locale, attrs)
  puts "  ✓ localization updated: #{locale}"
end

unless options[:metadata_only]
  build = latest_build(client, app_id, options[:platform], version_string, options[:build_number])
  unless build
    abort "valid #{options[:platform]} build not found — 先に iOS ビルドをアップロードしてください"
  end

  build_id = build.fetch("id")
  build_number = build.dig("attributes", "version")
  puts "Build: #{version_string} (#{build_number})"

  set_export_compliance(client, build_id)
  attach_build(client, version_id, build_id)
  puts "  ✓ build attached"
end

if options[:submit]
  abort "審査提出にはビルド紐付けが必要です（--metadata-only と併用不可）" if options[:metadata_only]

  submit_version(client, app_id, version_id, options[:platform])
  puts "✅ Submitted for App Review"
else
  puts "ℹ️ Metadata prepared. IPA 後: ruby scripts/appstore-prepare-and-submit.rb --version #{version_string}"
end
