#!/usr/bin/env ruby
# frozen_string_literal: true

# App Review Information > Notes（英語）を API で設定
# Usage: ruby scripts/appstore-update-review-notes.rb --version 1.2.3

require "optparse"

require_relative "asc-client"

options = {
  bundle_id: ENV.fetch("BUNDLE_ID", "jp.tomippe.gradatone"),
  version: nil,
  notes_path: File.expand_path("../docs/app-review-notes-en.txt", __dir__),
  contact_email: "tomi@tomippe.jp",
  contact_first: "TOMIHIDE",
  contact_last: "OTA",
  contact_phone: "+819045065291"
}

OptionParser.new do |opts|
  opts.on("--bundle-id VALUE") { |v| options[:bundle_id] = v }
  opts.on("--version VALUE") { |v| options[:version] = v }
  opts.on("--notes PATH") { |v| options[:notes_path] = v }
end.parse!

root = File.expand_path("..", __dir__)
options[:version] ||= File.read(File.join(root, "version.txt")).strip if File.file?(File.join(root, "version.txt"))

abort "notes file missing: #{options[:notes_path]}" unless File.file?(options[:notes_path])

notes = File.read(options[:notes_path], encoding: "UTF-8")[0, 3900]

client = asc_client
app = client.get("/v1/apps", "filter[bundleId]" => options[:bundle_id], "limit" => 1).fetch("data").first
abort "app not found" unless app

version = client.get("/v1/apps/#{app.fetch('id')}/appStoreVersions", "filter[platform]" => "IOS", "limit" => 50)
  .fetch("data")
  .find { |v| v.dig("attributes", "versionString") == options[:version] }
abort "version not found: #{options[:version]}" unless version

version_id = version.fetch("id")

detail = begin
  client.get("/v1/appStoreVersions/#{version_id}/appStoreReviewDetail").fetch("data")
rescue RuntimeError
  nil
end

unless detail
  detail = client.post(
    "/v1/appStoreReviewDetails",
    data: {
      type: "appStoreReviewDetails",
      attributes: {},
      relationships: {
        appStoreVersion: { data: { type: "appStoreVersions", id: version_id } }
      }
    }
  ).fetch("data")
end

detail_id = detail.fetch("id")
client.patch(
  "/v1/appStoreReviewDetails/#{detail_id}",
  data: {
    type: "appStoreReviewDetails",
    id: detail_id,
    attributes: {
      contactFirstName: options[:contact_first],
      contactLastName: options[:contact_last],
      contactEmail: options[:contact_email],
      contactPhone: ENV.fetch("ASC_REVIEW_PHONE", options[:contact_phone]),
      demoAccountRequired: false,
      notes: notes
    }
  }
)

puts "✅ App Review notes updated (#{options[:version]}, detail #{detail_id})"
