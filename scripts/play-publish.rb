#!/usr/bin/env ruby
# frozen_string_literal: true
# build-common ラッパー（テンプレート）— install-play-scripts.sh で配置

ENV["PROJECT_ROOT"] ||= File.expand_path("..", __dir__)

require_relative "wrapper-load-env"
wrapper_load_build_common_from_env

bc = if ENV["BUILD_COMMON"].to_s != ""
       File.expand_path(ENV["BUILD_COMMON"])
     else
       File.expand_path("../../build-common", __dir__)
     end

publish_rb = File.join(bc, "play-publish.rb")
abort "❌ build-common が見つかりません: #{bc}" unless File.file?(publish_rb)

load publish_rb
