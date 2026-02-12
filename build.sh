#!/bin/bash
set -e

# ===== Gradatone ビルドスクリプト =====

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

APP_NAME="gradatone"
DEV_PORT=8080
DEPLOY_DIR="../apps.tomippe.jp/gradatone"

# 共通スクリプト読み込み
source "$SCRIPT_DIR/../build-common/version.sh"
source "$SCRIPT_DIR/../build-common/ftp-upload.sh"
source "$SCRIPT_DIR/../build-common/dev-server.sh"
source "$SCRIPT_DIR/../build-common/git-commit.sh"

# バージョン読み込み
VERSION=$(version_read)

# package.json / manifest.json のバージョンを更新
jq ".version = \"${VERSION}\"" package.json > package.json.tmp && mv package.json.tmp package.json
echo "  ✓ package.jsonのバージョンを v${VERSION} に更新しました"

jq ".version = \"${VERSION}\"" manifest.json > manifest.json.tmp && mv manifest.json.tmp manifest.json
echo "  ✓ manifest.jsonのバージョンを更新しました"

echo "🎵 ${APP_NAME} v${VERSION} をビルド中..."

# 開発サーバーの停止
dev_server_stop $DEV_PORT

# デプロイ先のクリーンアップ
echo "🧹 デプロイ先をクリーンアップしています..."
if [ -d "$DEPLOY_DIR" ]; then
    find "$DEPLOY_DIR" -mindepth 1 -maxdepth 1 ! -name '.git' ! -name '.gitignore' -exec rm -rf {} +
    echo "  ✓ ${DEPLOY_DIR}/の中身を削除しました（.git関連は保護）"
else
    mkdir -p "$DEPLOY_DIR"
    echo "  ✓ ${DEPLOY_DIR}/ディレクトリを作成しました"
fi

# SCSSコンパイル
echo "🔨 SCSSをコンパイルしています..."
npm run sass:build
echo "  ✓ style.cssを生成しました"

# ファイルコピー
echo "📂 ファイルをコピーしています..."
cp index.html "$DEPLOY_DIR/"
cp style.css "$DEPLOY_DIR/"
cp app.js "$DEPLOY_DIR/"
cp sw.js "$DEPLOY_DIR/"
cp manifest.json "$DEPLOY_DIR/"
echo "  ✓ 主要ファイルをコピーしました"

# アイコンファイルをコピー
for icon in favicon.png apple-touch-icon.png; do
    if [ -f "$icon" ]; then
        cp "$icon" "$DEPLOY_DIR/"
        echo "  ✓ ${icon}をコピーしました"
    fi
done

# .htaccessがある場合はコピー
if [ -f ".htaccess" ]; then
    cp .htaccess "$DEPLOY_DIR/"
    echo "  ✓ .htaccessをコピーしました"
fi

echo "✅ ビルドが完了しました！"

# FTPアップロード
ftp_upload_dir "$DEPLOY_DIR" "gradatone"

# 次回用バージョン保存
echo ""
echo "📝 次回用バージョンを更新しています..."
version_save_next "$VERSION"

# Git コミット
git_commit_build "$VERSION"

# 開発サーバーの再起動
dev_server_restart $DEV_PORT "python3 -m http.server $DEV_PORT"

echo ""
echo "🎉 ${APP_NAME} v${VERSION} — すべて完了しました！"
