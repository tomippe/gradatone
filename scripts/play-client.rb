#!/usr/bin/env ruby
# frozen_string_literal: true
# build-common ラッパー（テンプレート）— install-play-scripts.sh で配置

ENV["PROJECT_ROOT"] ||= File.expand_path("..", __dir__)

require_relative "wrapper-load-env"
wrapper_load_build_common_from_env

def play_build_common_dir
  if ENV["BUILD_COMMON"].to_s != ""
    File.expand_path(ENV["BUILD_COMMON"])
  else
    File.expand_path("../../build-common", __dir__)
  end
end

bc = play_build_common_dir
client_rb = File.join(bc, "play-client.rb")
abort "❌ build-common が見つかりません: #{bc}\n   BUILD_COMMON を .env に設定するか、プロジェクトを build-common と同階層に置いてください" unless File.file?(client_rb)

load client_rb
