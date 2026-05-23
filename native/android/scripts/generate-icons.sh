#!/bin/bash
# Bubblewrap 相当の mipmap / splash をローカル PNG から生成（iconUrl が未取得のとき用）
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ANDROID_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC="${1:-$ANDROID_DIR/icons/512.png}"
RES="$ANDROID_DIR/app/src/main/res"

if [ ! -f "$SRC" ]; then
    echo "❌ icon source not found: $SRC"
    exit 1
fi

gen() {
    local size=$1 dest=$2
    mkdir -p "$(dirname "$dest")"
    sips -z "$size" "$size" "$SRC" --out "$dest" >/dev/null 2>&1 || cp "$SRC" "$dest"
}

# launcher
gen 48 "$RES/mipmap-mdpi/ic_launcher.png"
gen 72 "$RES/mipmap-hdpi/ic_launcher.png"
gen 96 "$RES/mipmap-xhdpi/ic_launcher.png"
gen 144 "$RES/mipmap-xxhdpi/ic_launcher.png"
gen 192 "$RES/mipmap-xxxhdpi/ic_launcher.png"

# adaptive maskable (ic_launcher.xml references @mipmap/ic_maskable)
gen 48 "$RES/mipmap-mdpi/ic_maskable.png"
gen 72 "$RES/mipmap-hdpi/ic_maskable.png"
gen 96 "$RES/mipmap-xhdpi/ic_maskable.png"
gen 144 "$RES/mipmap-xxhdpi/ic_maskable.png"
gen 192 "$RES/mipmap-xxxhdpi/ic_maskable.png"

# splash
gen 300 "$RES/drawable-mdpi/splash.png"
gen 450 "$RES/drawable-hdpi/splash.png"
gen 600 "$RES/drawable-xhdpi/splash.png"
gen 900 "$RES/drawable-xxhdpi/splash.png"
gen 1200 "$RES/drawable-xxxhdpi/splash.png"

cp "$SRC" "$ANDROID_DIR/store_icon.png"
echo "✅ Android launcher / splash icons generated from $SRC"
