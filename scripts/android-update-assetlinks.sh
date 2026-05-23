#!/bin/bash
# build-common ラッパー（テンプレート）— install-play-scripts.sh で配置
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -n "${BUILD_COMMON:-}" ]; then
  BC="$(cd "$BUILD_COMMON" && pwd)"
else
  BC="$(cd "$SCRIPT_DIR/../../build-common" && pwd)"
fi

ASSET="$BC/android-update-assetlinks.sh"
if [ ! -x "$ASSET" ]; then
  echo "❌ build-common が見つかりません: $BC" >&2
  exit 1
fi

exec "$ASSET"
