# frozen_string_literal: true

def wrapper_load_build_common_from_env
  return if ENV["BUILD_COMMON"].to_s != ""

  root = ENV["PROJECT_ROOT"] || File.expand_path("..", __dir__)
  env_file = File.join(root, ".env")
  return unless File.file?(env_file)

  File.foreach(env_file) do |line|
    next if line.strip.empty? || line.lstrip.start_with?("#")

    key, value = line.strip.split("=", 2)
    next unless key == "BUILD_COMMON" && value

    ENV["BUILD_COMMON"] = value.gsub(/\A['"]|['"]\z/, "")
    break
  end
end
