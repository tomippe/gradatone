#!/bin/bash
set -e

# ===== Gradatone Android TWA ビルド =====
# Bubblewrap: 本番 PWA https://apps.tomippe.jp/gradatone/ を Trusted Web Activity で表示

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
BUILD_COMMON="$(cd "$ROOT_DIR/../build-common" && pwd)"

source "$BUILD_COMMON/version.sh"
source "$BUILD_COMMON/android-keystore.sh"

APP_ONLY=false
SKIP_REACT=false
NO_UPLOAD=false
while [ $# -gt 0 ]; do
    case "$1" in
        -app) APP_ONLY=true ;;
        -skip-react) SKIP_REACT=true ;;
        -no-upload) NO_UPLOAD=true ;;
    esac
    shift || true
done

VERSION=$(version_read "$ROOT_DIR/version.txt")
VERSION_CODE_FILE="$SCRIPT_DIR/version-code.txt"
VERSION_CODE=$(cat "$VERSION_CODE_FILE" 2>/dev/null | tr -d '[:space:]')
[ -z "$VERSION_CODE" ] && VERSION_CODE=1

echo "🔨 Gradatone Android TWA v${VERSION} (versionCode ${VERSION_CODE}) をビルド中..."

ANDROID_KEYSTORE_DEFAULT="$SCRIPT_DIR/keystore/upload.keystore"
ANDROID_KEY_ALIAS_DEFAULT="upload"
android_keystore_load "$SCRIPT_DIR/keystore.properties" "$ROOT_DIR"

KEYSTORE="$RELEASE_STORE_FILE"
KEY_ALIAS="$RELEASE_KEY_ALIAS"
KEYSTORE_PASSWORD="$RELEASE_STORE_PASSWORD"
KEY_PASSWORD="$RELEASE_KEY_PASSWORD"

ensure_keystore() {
    if [ -f "$KEYSTORE" ]; then
        return 0
    fi
    android_keystore_prompt_if_missing
    if [ -z "$KEYSTORE_PASSWORD" ]; then
        echo "❌ キーストアがありません: $KEYSTORE"
        echo "   ~/Secrets/android-signing.env（build-common/android-env.example 参照）"
        echo "   または native/android/keystore.properties を設定してください"
        exit 1
    fi
    echo "🔑 キーストアを新規作成しています..."
    mkdir -p "$(dirname "$KEYSTORE")"
    keytool -genkeypair -v \
        -keystore "$KEYSTORE" \
        -alias "$KEY_ALIAS" \
        -keyalg RSA -keysize 2048 -validity 10000 \
        -storepass "$KEYSTORE_PASSWORD" \
        -keypass "$KEY_PASSWORD" \
        -dname "CN=tomippe, OU=Studio Tomippe, O=tomippe, L=Tokyo, ST=Tokyo, C=JP"
    echo "  ✓ $KEYSTORE"
}

sync_icons() {
    local icon_src=""
    if [ -f "$ROOT_DIR/icon-512.png" ]; then
        icon_src="$ROOT_DIR/icon-512.png"
    elif [ -f "$ROOT_DIR/public/icons/android/512.png" ]; then
        icon_src="$ROOT_DIR/public/icons/android/512.png"
    elif [ -f "$ROOT_DIR/native/ios/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png" ]; then
        icon_src="$ROOT_DIR/native/ios/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"
        mkdir -p "$ROOT_DIR/public/icons/android"
        sips -z 512 512 "$icon_src" --out "$ROOT_DIR/public/icons/android/512.png" 2>/dev/null || cp "$icon_src" "$ROOT_DIR/public/icons/android/512.png"
        cp "$ROOT_DIR/public/icons/android/512.png" "$ROOT_DIR/public/icons/android/maskable-512.png"
        icon_src="$ROOT_DIR/public/icons/android/512.png"
    fi
    if [ -n "$icon_src" ]; then
        mkdir -p "$SCRIPT_DIR/icons"
        cp "$icon_src" "$SCRIPT_DIR/icons/512.png"
        cp "$icon_src" "$SCRIPT_DIR/icons/maskable-512.png"
        echo "  ✓ icons/（Bubblewrap 用）を同期しました"
    fi
}

update_twa_manifest_version() {
    local tmp
    tmp=$(mktemp)
    jq --arg v "$VERSION" --argjson code "$VERSION_CODE" \
        '.appVersion = $v | .appVersionCode = $code' \
        "$SCRIPT_DIR/twa-manifest.json" > "$tmp"
    mv "$tmp" "$SCRIPT_DIR/twa-manifest.json"
    if [ -f "$SCRIPT_DIR/app/build.gradle" ]; then
        sed -i '' "s/versionCode [0-9]*/versionCode ${VERSION_CODE}/" "$SCRIPT_DIR/app/build.gradle"
        sed -i '' "s/versionName \"[^\"]*\"/versionName \"${VERSION}\"/" "$SCRIPT_DIR/app/build.gradle"
    fi
    echo "  ✓ version → ${VERSION} (${VERSION_CODE})"
}

cd "$SCRIPT_DIR"

export JAVA_HOME="${JAVA_HOME:-/Applications/Android Studio.app/Contents/jbr/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
mkdir -p "$HOME/.bubblewrap"
cat > "$HOME/.bubblewrap/config.json" <<EOF
{"jdkPath":"${JAVA_HOME}","androidSdkPath":"${ANDROID_HOME}"}
EOF

if ! $SKIP_REACT; then
    echo "📦 （参考）ネイティブ同梱は不要。Web デプロイが Android の中身です。"
fi

if [ -f "$HOME/Secrets/android-signing.env" ]; then
    echo "  ✓ ~/Secrets/android-signing.env"
elif [ -f "$SCRIPT_DIR/keystore.properties" ]; then
    echo "  ✓ keystore.properties"
fi

sync_icons
if $APP_ONLY; then
    echo "  ⏭️  -app: キーストア不要（署名スキップ）"
else
    ensure_keystore
fi
update_twa_manifest_version

echo "📦 npm install (@bubblewrap/cli)..."
npm install --no-fund --no-audit

"$SCRIPT_DIR/scripts/generate-icons.sh" "$SCRIPT_DIR/icons/512.png"

if [ ! -f "$SCRIPT_DIR/app/build.gradle" ] || [ "${TWA_FORCE_UPDATE:-}" = "1" ]; then
    echo "📱 Bubblewrap update（プロジェクト生成 / twa-manifest 反映）..."
    if ! printf '%s\n' "$VERSION" | npx bubblewrap update --manifest="$SCRIPT_DIR/twa-manifest.json" --skipPwaValidation 2>/dev/null; then
        echo "  ⚠️ bubblewrap update をスキップ（アイコン未取得時は generate-icons のみ）"
    fi
    "$SCRIPT_DIR/scripts/generate-icons.sh" "$SCRIPT_DIR/icons/512.png"
else
    echo "📱 既存 Android プロジェクトを使用（TWA_FORCE_UPDATE=1 で bubblewrap update）"
fi

mkdir -p "$SCRIPT_DIR/dist"

gradle_build() {
    export ANDROID_HOME JAVA_HOME
    chmod +x "$SCRIPT_DIR/gradlew"
    if $APP_ONLY; then
        echo "🔨 assembleRelease（-app: Gradle・署名なし）..."
        "$SCRIPT_DIR/gradlew" -p "$SCRIPT_DIR" assembleRelease --no-daemon
        local apk="$SCRIPT_DIR/app/build/outputs/apk/release/app-release-unsigned.apk"
        [ -f "$apk" ] || apk="$SCRIPT_DIR/app/build/outputs/apk/release/app-release.apk"
        if [ ! -f "$apk" ]; then
            echo "❌ APK が見つかりません"
            find "$SCRIPT_DIR/app/build/outputs" -name "*.apk" 2>/dev/null | head -5
            exit 1
        fi
        cp "$apk" "$SCRIPT_DIR/dist/Gradatone-unsigned.apk"
        echo "✅ $SCRIPT_DIR/dist/Gradatone-unsigned.apk"
    else
        android_keystore_prompt_if_missing
        if [ -z "$KEYSTORE_PASSWORD" ] || [ ! -f "$KEYSTORE" ]; then
            echo "❌ リリースビルドには署名設定が必要です"
            echo "   cp keystore.properties.example keystore.properties"
            echo "   または ~/Secrets/android-signing.env（build-common/android-env.example）"
            exit 1
        fi
        echo "🔨 bundleRelease（Gradle + 署名）..."
        "$SCRIPT_DIR/gradlew" -p "$SCRIPT_DIR" bundleRelease \
            -Pandroid.injected.signing.store.file="$KEYSTORE" \
            -Pandroid.injected.signing.store.password="$KEYSTORE_PASSWORD" \
            -Pandroid.injected.signing.key.alias="$KEY_ALIAS" \
            -Pandroid.injected.signing.key.password="$KEY_PASSWORD" \
            --no-daemon
        local aab="$SCRIPT_DIR/app/build/outputs/bundle/release/app-release.aab"
        if [ ! -f "$aab" ]; then
            echo "❌ AAB が見つかりません"
            find "$SCRIPT_DIR/app/build/outputs" -name "*.aab" 2>/dev/null | head -5
            exit 1
        fi
        cp "$aab" "$SCRIPT_DIR/dist/Gradatone.aab"
        echo "✅ $SCRIPT_DIR/dist/Gradatone.aab"
    fi
}

gradle_build

if [ -x "$ROOT_DIR/scripts/android-update-assetlinks.sh" ]; then
    echo ""
    "$ROOT_DIR/scripts/android-update-assetlinks.sh" || echo "⚠️ assetlinks 更新をスキップ"
fi

AAB_OUT="$SCRIPT_DIR/dist/Gradatone.aab"
if ! $APP_ONLY && ! $NO_UPLOAD && [ -f "$AAB_OUT" ] && [ -f "$ROOT_DIR/scripts/play-publish.rb" ]; then
    echo ""
    echo "📤 Google Play（内部テスト）へアップロード..."
    ruby "$ROOT_DIR/scripts/play-publish.rb" --version "$VERSION" --aab "$AAB_OUT" --track internal || \
        echo "  ⚠️ Play アップロードをスキップ（Console にアプリ未作成・権限未設定の可能性）"
fi

echo $((VERSION_CODE + 1)) > "$VERSION_CODE_FILE"
echo ""
echo "🎉 Android TWA ビルド完了（次回 versionCode: $((VERSION_CODE + 1))）"
