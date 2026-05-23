# shellcheck shell=bash
# プロジェクト .env から BUILD_COMMON のみ読む（ラッパー用）
wrapper_load_build_common_from_env() {
  if [ -n "${BUILD_COMMON:-}" ]; then
    return 0
  fi
  local env_file="${PROJECT_ROOT}/.env"
  [ -f "$env_file" ] || return 0
  local line
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      \#*|'') continue ;;
      BUILD_COMMON=*)
        BUILD_COMMON="${line#BUILD_COMMON=}"
        BUILD_COMMON="${BUILD_COMMON%\"}"
        BUILD_COMMON="${BUILD_COMMON#\"}"
        export BUILD_COMMON
        return 0
        ;;
    esac
  done < "$env_file"
}
