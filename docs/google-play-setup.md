# Gradatone — Google Play（Android TWA）

正本の共通手順: `/Users/tomippe/Cursor/build-common/google-play-setup.md`

## このアプリの値

| 項目 | 値 |
|------|-----|
| パッケージ名 | `jp.tomippe.gradatone` |
| TWA URL | `https://apps.tomippe.jp/gradatone/` |
| プライバシーポリシー | https://apps.tomippe.jp/gradatone/policy/ |
| AAB 出力 | `native/android/dist/Gradatone.aab` |
| 掲載文言 | `scripts/store-locales.rb`（App Store と共通） |

## 初回チェックリスト

1. `.env` に `GOOGLE_PLAY_PACKAGE_NAME=jp.tomippe.gradatone`（`.env.example` 参照）
2. `~/.google-env` — サービスアカウント JSON パス
3. Play Console → **ユーザーと権限** に SA を招待（リリースを管理・掲載情報を管理）
4. Play Console でアプリを新規作成（パッケージ名一致）
5. `~/.android-env` または `native/android/keystore.properties` で署名
6. `./native/android/build.sh -skip-react` で AAB ビルド
7. `ASSETLINKS_OUT_DIR=public/.well-known ./scripts/android-update-assetlinks.sh` → サイトルート `.well-known` へデプロイ
8. `ruby scripts/play-publish.rb --aab native/android/dist/Gradatone.aab --track internal`
9. `scripts/play-sync-listing.sh` でストア掲載（3言語）

## API 動作確認

```bash
cd /Users/tomippe/Cursor/gradatone
source ~/.google-env && source .env
export PROJECT_ROOT="$PWD"
ruby -r ./scripts/play-client -e 'c=play_client; e=c.insert_edit; puts "OK edit=#{e}"; c.delete_edit(e)'
```

`404 Package not found` → Play でアプリ未作成、またはパッケージ名不一致。

## WordPress 紹介ページ

Android ボタン追加時:

- `platform`: `["web","mac","ios","android"]` 等
- `app-androiddesc`: `Android 8+, Google Play<br>日本語,English,中文`
- `app-androidurl`: Play 公開後のストア URL

## iOS との違い

| | iOS (Capacitor) | Android (TWA) |
|--|-----------------|---------------|
| 中身 | `native/store-web/` 同梱 | 本番 HTTPS |
| UI 更新 | ストア再提出 | `./build.sh` で Web デプロイ |
| バージョン | `version.txt` | `version.txt` + `native/android/version-code.txt` |
