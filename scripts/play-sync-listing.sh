#!/bin/bash
# build-common ラッパー（テンプレート）— install-play-scripts.sh で配置
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# shellcheck source=wrapper-load-env.sh
source "$SCRIPT_DIR/wrapper-load-env.sh"
wrapper_load_build_common_from_env

if [ -n "${BUILD_COMMON:-}" ]; then
  BC="$(cd "$BUILD_COMMON" && pwd)"
else
  BC="$(cd "$SCRIPT_DIR/../../build-common" && pwd)"
fi

SYNC="$BC/play-sync-listing.sh"
if [ ! -x "$SYNC" ]; then
  echo "❌ build-common が見つかりません: $BC" >&2
  exit 1
fi

exec "$SYNC" "$@"
