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

echo "[1/5] 配信する国または地域（全ストアフロント）"
ruby scripts/appstore-set-territories.rb

echo "[2/5] アプリ情報（配信権・年齢・カテゴリ・著作権・価格）"
ruby scripts/appstore-setup-app-info.rb --version "$VERSION" --no-ipad-screenshots

echo "[3/5] バージョン文言・プロモ文"
ruby scripts/appstore-prepare-and-submit.rb --version "$VERSION" --metadata-only

if [[ -d "ss/iPhone" ]] && compgen -G "ss/iPhone/*" >/dev/null; then
  echo "[4/5] iPhone スクショ変換（ss/iPhone → ss/）"
  bash scripts/prepare-iphone-screenshots.sh
fi

shopt -s nullglob
ss_files=(ss/[0-9]*.png ss/[0-9]*.jpg ss/[0-9]*.jpeg ss/[0-9]*.PNG ss/[0-9]*.JPG ss/[0-9]*.JPEG)
if ((${#ss_files[@]} > 0)); then
  echo "[5/6] iPhone スクショ（APP_IPHONE_67）"
  for loc in "${LOCALES[@]}"; do
    ruby scripts/appstore-upload-screenshots.rb --version "$VERSION" --locale "$loc" --preset iphone-67 || exit 1
  done
  if [[ -d ss/ipad ]] && compgen -G "ss/ipad/[0-9]*.png" >/dev/null; then
    echo "[6/6] iPad スクショ（APP_IPAD_PRO_3GEN_129）"
    for loc in "${LOCALES[@]}"; do
      ruby scripts/appstore-upload-screenshots.rb --version "$VERSION" --locale "$loc" --preset ipad-129 || exit 1
    done
  else
    echo "[6/6] iPad スクショ未生成 — scripts/prepare-iphone-screenshots.sh 後 ss/ipad/ を確認"
  fi
else
  echo "[5/6] スキップ: ss/ にスクショなし（審査前に要準備）" >&2
fi
shopt -u nullglob 2>/dev/null || true

echo "[審査メモ] App Review notes"
ruby scripts/appstore-update-review-notes.rb --version "$VERSION" || echo "  ⚠️ review notes skipped"

echo ""
echo "✅ API 反映完了。Connect: https://appstoreconnect.apple.com/apps/6772448588/distribution"
echo "  - アプリのプライバシー（データ収集なし）※ Web のみ"
echo "  - 初回 IPA 後: appstore-prepare-and-submit.rb（ビルド紐付け）"
