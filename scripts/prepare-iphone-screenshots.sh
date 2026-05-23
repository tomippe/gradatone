#!/bin/bash
# ss/iPhone の mov/jpeg を App Store 6.7" 用 PNG (1320x2868) に変換 → ss/
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/ss/iPhone"
OUT="$ROOT/ss"
W=1320
H=2868

mkdir -p "$OUT"

scale_pad() {
  local in="$1" out="$2"
  ffmpeg -y -hide_banner -loglevel error -i "$in" \
    -vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black" \
    -frames:v 1 "$out"
}

if [[ -f "$SRC/01.mov" ]]; then
  scale_pad "$SRC/01.mov" "$OUT/01.png"
  echo "  ✓ 01.png (from 01.mov)"
fi

if [[ -f "$SRC/02.mov" ]]; then
  scale_pad "$SRC/02.mov" "$OUT/02.png"
  echo "  ✓ 02.png (from 02.mov)"
fi

if [[ -f "$SRC/03.jpeg" ]]; then
  scale_pad "$SRC/03.jpeg" "$OUT/03.png"
  echo "  ✓ 03.png (from 03.jpeg)"
fi

IPAD="$ROOT/ss/ipad"
W_IPAD=2064
H_IPAD=2752
mkdir -p "$IPAD"
for n in 01 02 03; do
  if [[ -f "$OUT/${n}.png" ]]; then
    ffmpeg -y -hide_banner -loglevel error -i "$OUT/${n}.png" \
      -vf "scale=${W_IPAD}:${H_IPAD}:force_original_aspect_ratio=decrease,pad=${W_IPAD}:${H_IPAD}:(ow-iw)/2:(oh-ih)/2:color=black" \
      "$IPAD/${n}.png"
    echo "  ✓ ipad/${n}.png"
  fi
done

echo "Done → $OUT/ and $IPAD/"
