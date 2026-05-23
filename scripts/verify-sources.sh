#!/bin/bash
# web-src / native-src / store-web の分離を検証
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail() { echo "❌ $1"; exit 1; }

grep -q 'ensureAudioReady' native-src/app.js || fail 'native-src/app.js に ensureAudioReady がありません'
grep -q 'isNativeCapacitor' native-src/app.js || fail 'native-src/app.js に isNativeCapacitor がありません'
grep -q 'ensureAudioReady' web-src/app.js && fail 'web-src/app.js に ensureAudioReady が混入しています'
grep -q 'async initAudio' web-src/app.js || fail 'web-src/app.js に initAudio がありません'
grep -q 'id="scaleSelect"' web-src/index.html || fail 'web-src/index.html に scaleSelect がありません'
grep -q 'स/प' web-src/index.html || fail 'web-src/index.html にインド Label がありません'

if [ -f native/store-web/app.js ]; then
  grep -q 'ensureAudioReady' native/store-web/app.js || fail 'store-web/app.js がネイティブ版ではありません'
  if cmp -s web-src/app.js native/store-web/app.js 2>/dev/null; then
    fail 'store-web/app.js が web-src/app.js と同一です（ビルド経路の誤り）'
  fi
fi

echo "✓ web-src / native-src の分離 OK"
