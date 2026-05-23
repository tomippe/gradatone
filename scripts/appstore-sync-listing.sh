#!/bin/bash
# App Store Connect ストア掲載情報を API で一括反映（Gradatone）
# 用法: ./scripts/appstore-sync-listing.sh 1.1.36

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="${1:-}"
LOCALES=(ja en-US zh-Hans)

if [[ -z "$VERSION" ]]; then
  echo "用法: $0 <versionString>  例: $0 1.1.36" >&2
  exit 1
fi

cd "$ROOT"

echo "=== Gradatone App Store 掲載同期 v${VERSION} ==="

echo "[1/4] 配信する国または地域（全ストアフロント）"
ruby scripts/appstore-set-territories.rb

echo "[2/4] アプリ情報（配信権・年齢・カテゴリ・著作権・価格）"
ruby scripts/appstore-setup-app-info.rb --version "$VERSION" --no-ipad-screenshots

echo "[3/4] バージョン文言・プロモ文"
ruby scripts/appstore-prepare-and-submit.rb --version "$VERSION" --metadata-only

if compgen -G "ss/[0-9]*.{png,jpg,jpeg,PNG,JPG,JPEG}" >/dev/null; then
  echo "[4/4] iPhone スクショ（ss/ → APP_IPHONE_67）"
  for loc in "${LOCALES[@]}"; do
    ruby scripts/appstore-upload-screenshots.rb --version "$VERSION" --locale "$loc" 2>/dev/null || echo "  ⚠️ appstore-upload-screenshots.rb 未配置: $loc"
  done
else
  echo "[4/4] スキップ: ss/ にスクショなし（審査前に要準備）" >&2
fi

echo ""
echo "✅ API 反映完了。Connect: https://appstoreconnect.apple.com/apps/6772448588/distribution"
echo "  - アプリのプライバシー（データ収集なし）※ Web のみ"
echo "  - 初回 IPA 後: appstore-prepare-and-submit.rb（ビルド紐付け）"
