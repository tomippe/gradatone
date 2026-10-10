#!/bin/bash
set -e

# Gradatone iOS — store-web → Capacitor → Archive → TestFlight
# 用法: ./build.sh [-skip-web] [-no-upload] [-cm "message"]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
IOS_APP_DIR="$SCRIPT_DIR/ios/App"
PBXPROJ="$IOS_APP_DIR/App.xcodeproj/project.pbxproj"
BUNDLE_ID="jp.tomippe.gradatone"
TEAM_ID="${APPLE_TEAM_ID:-4U63Y3X98K}"

if [ -f "$HOME/.apple-env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$HOME/.apple-env"
  set +a
fi
APPLE_ID="${APPLE_ID:-tomi@tomippe.jp}"
TEAM_ID="${APPLE_TEAM_ID:-$TEAM_ID}"

source "$ROOT_DIR/../build-common/version.sh"
source "$ROOT_DIR/../build-common/git-commit.sh"

SKIP_WEB=false
NO_UPLOAD=false
NO_VERUP=false
TESTFLIGHT_NOTES=""
COMMIT_MSG=""
while [ $# -gt 0 ]; do
  case "$1" in
    -skip-web) SKIP_WEB=true ;;
    -no-upload) NO_UPLOAD=true ;;
    -noverup) NO_VERUP=true ;;
    -cm) shift; COMMIT_MSG="${1:-}" ;;
    -testflight-notes) shift; TESTFLIGHT_NOTES="${1:-}" ;;
  esac
  shift || true
done

VERSION=$(version_read "$ROOT_DIR/version.txt")
jq ".version = \"${VERSION}\"" "$ROOT_DIR/package.json" > "$ROOT_DIR/package.json.tmp" && mv "$ROOT_DIR/package.json.tmp" "$ROOT_DIR/package.json"
jq ".version = \"${VERSION}\"" "$ROOT_DIR/manifest.json" > "$ROOT_DIR/manifest.json.tmp" && mv "$ROOT_DIR/manifest.json.tmp" "$ROOT_DIR/manifest.json"
echo "  ✓ ビルドバージョン v${VERSION}"
[ -z "$TESTFLIGHT_NOTES" ] && [ -n "$COMMIT_MSG" ] && TESTFLIGHT_NOTES="v${VERSION} - ${COMMIT_MSG}"
echo "🎵 Gradatone iOS v${VERSION} をビルド中..."

if ! $SKIP_WEB; then
  cd "$ROOT_DIR"
  npm run build:store-web
fi

if [ ! -f "$ROOT_DIR/native/store-web/index.html" ]; then
  echo "❌ native/store-web/index.html がありません"
  exit 1
fi

ICON_SRC=""
for candidate in \
  "$ROOT_DIR/apple-touch-icon.png" \
  "$ROOT_DIR/icon-512.png" \
  "$ROOT_DIR/favicon.png" \
  "$ROOT_DIR/native/store-web/apple-touch-icon.png" \
  "$ROOT_DIR/native/store-web/icon-512.png"; do
  if [ -f "$candidate" ]; then
    ICON_SRC="$candidate"
    break
  fi
done
if [ -n "$ICON_SRC" ] && [ -f "$IOS_APP_DIR/App/Assets.xcassets/AppIcon.appiconset/Contents.json" ]; then
  echo "🎨 App Icon ← $(basename "$ICON_SRC")（Web 版）"
  ICON_DEST="$IOS_APP_DIR/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"
  magick "$ICON_SRC" -resize 1024x1024 -filter Lanczos "$ICON_DEST"
else
  echo "  ⚠️ App Icon 用 PNG がありません（apple-touch-icon.png / icon-512.png を確認）"
fi

cd "$SCRIPT_DIR"

if [ ! -f "$PBXPROJ" ]; then
  echo "📱 Capacitor iOS プロジェクトを作成します（初回）..."
  npm install --legacy-peer-deps --no-audit --no-fund
  npx cap add ios
fi

npm install --legacy-peer-deps --no-audit --no-fund
npx cap sync ios

# cap sync は Main.storyboard を CAPBridgeViewController に戻すことがある
STORYBOARD="$IOS_APP_DIR/App/Base.lproj/Main.storyboard"
if [ -f "$STORYBOARD" ] && grep -q 'customClass="CAPBridgeViewController"' "$STORYBOARD"; then
  sed -i '' 's/customClass="CAPBridgeViewController" customModule="Capacitor"/customClass="MyBridgeViewController" customModule="App"/' "$STORYBOARD"
  echo "  ✓ Main.storyboard → MyBridgeViewController"
fi

if [ ! -f "$PBXPROJ" ]; then
  echo "❌ Xcode project が見つかりません: $PBXPROJ"
  exit 1
fi

INFO_PLIST="$IOS_APP_DIR/App/Info.plist"
if [ -f "$INFO_PLIST" ]; then
  plutil -replace CFBundleDisplayName -string "Gradatone" "$INFO_PLIST" 2>/dev/null || true
  plutil -replace ITSAppUsesNonExemptEncryption -bool NO "$INFO_PLIST" 2>/dev/null || true
fi

echo "📝 Xcode バージョンを更新..."
sed -i '' "s/MARKETING_VERSION = [^;]*/MARKETING_VERSION = ${VERSION}/" "$PBXPROJ"
CURRENT_BUILD=$(grep -m 1 "CURRENT_PROJECT_VERSION = " "$PBXPROJ" | sed 's/.*CURRENT_PROJECT_VERSION = \([0-9]*\).*/\1/')
[ -z "$CURRENT_BUILD" ] && CURRENT_BUILD=0
NEW_BUILD=$((CURRENT_BUILD + 1))
sed -i '' "s/CURRENT_PROJECT_VERSION = [0-9]*/CURRENT_PROJECT_VERSION = ${NEW_BUILD}/g" "$PBXPROJ"
sed -i '' "s/PRODUCT_BUNDLE_IDENTIFIER = [^;]*/PRODUCT_BUNDLE_IDENTIFIER = ${BUNDLE_ID}/g" "$PBXPROJ"
if [ -n "$TEAM_ID" ]; then
  if grep -q "DEVELOPMENT_TEAM = " "$PBXPROJ"; then
    sed -i '' "s/DEVELOPMENT_TEAM = [^;]*/DEVELOPMENT_TEAM = ${TEAM_ID}/g" "$PBXPROJ"
  fi
fi
echo "  ✓ MARKETING_VERSION=${VERSION} BUILD=${NEW_BUILD}"

ARCHIVE_PATH="$SCRIPT_DIR/ios/build/App.xcarchive"
EXPORT_PATH="$SCRIPT_DIR/ios/build/export"
rm -rf "${ARCHIVE_PATH}" "${EXPORT_PATH}"

cat > "$IOS_APP_DIR/ExportOptions.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>app-store-connect</string>
  <key>teamID</key>
  <string>${TEAM_ID}</string>
  <key>uploadSymbols</key>
  <true/>
  <key>signingStyle</key>
  <string>automatic</string>
</dict>
</plist>
EOF

echo "📱 Archive..."
cd "$IOS_APP_DIR"
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "${ARCHIVE_PATH}" \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  archive

cd "$SCRIPT_DIR"
echo "📦 Export IPA..."
EXPORT_ARGS=(
  -exportArchive
  -archivePath "${ARCHIVE_PATH}"
  -exportPath "${EXPORT_PATH}"
  -exportOptionsPlist "$IOS_APP_DIR/ExportOptions.plist"
  -allowProvisioningUpdates
)
if [ -n "${APP_STORE_CONNECT_API_KEY_KEY_ID:-}" ] && [ -n "${APP_STORE_CONNECT_API_KEY_ISSUER_ID:-}" ] && [ -n "${APP_STORE_CONNECT_API_KEY_KEY_FILEPATH:-}" ]; then
  EXPORT_ARGS+=(
    -authenticationKeyPath "${APP_STORE_CONNECT_API_KEY_KEY_FILEPATH}"
    -authenticationKeyID "${APP_STORE_CONNECT_API_KEY_KEY_ID}"
    -authenticationKeyIssuerID "${APP_STORE_CONNECT_API_KEY_ISSUER_ID}"
  )
  echo "  ℹ️ App Store Connect API キーでエクスポート"
fi
if ! xcodebuild "${EXPORT_ARGS[@]}"; then
  echo "❌ IPA エクスポートに失敗しました"
  exit 1
fi

IPA_FILE=$(ls "${EXPORT_PATH}"/*.ipa 2>/dev/null | head -1)
if [ -z "$IPA_FILE" ]; then
  echo "❌ IPA が見つかりません"
  exit 1
fi
echo "  📁 ${IPA_FILE}"

if $NO_UPLOAD; then
  echo "⏭️  -no-upload: アップロードをスキップ"
else
  echo "📤 App Store Connect へアップロード..."
  ALTOOL_OUTPUT=$(xcrun altool --upload-app -f "${IPA_FILE}" -t ios \
    -u "$APPLE_ID" -p @keychain:AC_PASSWORD 2>&1) || true
  echo "$ALTOOL_OUTPUT"
  if echo "$ALTOOL_OUTPUT" | grep -qE "UPLOAD SUCCEEDED|No errors"; then
    echo "✅ アップロード完了"
    if [ -n "$TESTFLIGHT_NOTES" ] && [ -f "$ROOT_DIR/../build-common/update-testflight-whats-new.rb" ]; then
      ruby "$ROOT_DIR/../build-common/update-testflight-whats-new.rb" \
        --bundle-id "$BUNDLE_ID" \
        --version "$VERSION" \
        --build-number "$NEW_BUILD" \
        --locale "${TESTFLIGHT_WHAT_TO_TEST_LOCALE:-ja}" \
        --notes "$TESTFLIGHT_NOTES" || true
    fi
  else
    echo "⚠️ 自動アップロード失敗 — Xcode Organizer から ${IPA_FILE} を手動アップロードできます"
    exit 1
  fi
fi

echo "✅ Gradatone iOS v${VERSION} (build ${NEW_BUILD}) 完了"

if ! $NO_VERUP; then
  echo ""
  echo "📝 次回用バージョンを更新しています..."
  version_save_next "$VERSION" "$ROOT_DIR/version.txt"
fi

if [ -n "$COMMIT_MSG" ]; then
  cd "$ROOT_DIR"
  git_commit_build "$VERSION" "$COMMIT_MSG"
fi
