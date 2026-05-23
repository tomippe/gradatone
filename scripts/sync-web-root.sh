#!/bin/bash
# web-src → ルート（ローカル dev / 旧パス互換）。FTP・store-web には使わない。
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm run sass:build:web
cp web-src/app.js web-src/index.html web-src/style.css .
echo "  ✓ web-src をルートに同期（開発用）"
