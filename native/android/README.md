# Gradatone Android 版（TWA）

[Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity/) で本番 PWA をラップします。

- **表示 URL**: `https://apps.tomippe.jp/gradatone/`
- **パッケージ名**: `jp.tomippe.gradatone`（iOS と同一）
- **中身**: Web デプロイと常に同期（Capacitor の `store-web` 同梱はしない）

## 前提

| 項目 | 要件 |
|------|------|
| JDK | 17+（Android Studio 同梱 JBR で可） |
| Android SDK | Android Studio でインストール済み |
| Node.js | Bubblewrap CLI 用 |
| 環境変数 | `JAVA_HOME`, `ANDROID_HOME`（未設定時 build.sh が Studio 既定パスを使用） |

## 署名（Play 用 upload keystore）

`build-common/android-keystore.sh` と同じ方式です。

1. **`~/.android-env`**（推奨）— 雛形: `build-common/android-env.example`
2. **`native/android/keystore.properties`** — 雛形: `keystore.properties.example`
3. 対話プロンプト

キーストア既定: `native/android/keystore/upload.keystore`（エイリアス `upload`）

## ビルド

```bash
# リリース AAB（Play 提出用）
./native/android/build.sh -skip-react

# 署名なし APK（ローカル確認）
./native/android/build.sh -skip-react -app
```

成果物: `native/android/dist/Gradatone.aab`

## Digital Asset Links（必須）

TWA がフルスクリーンで開くには、**サイトルート**に `assetlinks.json` が必要です。

```bash
# .env に GOOGLE_PLAY_PACKAGE_NAME=jp.tomippe.gradatone を設定後
ASSETLINKS_OUT_DIR=public/.well-known ./scripts/android-update-assetlinks.sh
```

生成物を `https://apps.tomippe.jp/.well-known/assetlinks.json` へ FTP（POUCHES と同様、ドメイン直下）。詳細は `docs/google-play-setup.md`。

## Google Play

1. [Play Console](https://play.google.com/console) でアプリ作成（パッケージ `jp.tomippe.gradatone`）
2. `~/.google-env` + `.env` の `GOOGLE_PLAY_PACKAGE_NAME`
3. 内部テストへ AAB アップロード: `ruby scripts/play-publish.rb --aab native/android/dist/Gradatone.aab --track internal`
4. 掲載文言: `scripts/play-sync-listing.sh`（`store-locales.rb` 正本）

手順の正本: [`docs/google-play-setup.md`](../../docs/google-play-setup.md)

## Bubblewrap

- 設定: [`twa-manifest.json`](twa-manifest.json)
- 再生成: `TWA_FORCE_UPDATE=1 ./native/android/build.sh -skip-react`
