# Gradatone — App Store Connect メタデータ

- Connect: https://appstoreconnect.apple.com/apps/6772448588/distribution
- Bundle ID: `jp.tomippe.gradatone`
- プライバシーポリシー: https://apps.tomippe.jp/gradatone/policy/
- サポート URL: https://apps.tomippe.jp/gradatone/

## 審査メモ（Notes for Review · 英語推奨）

Gradatone is a touch-controlled musical instrument. Sound starts after the user touches the play area (Web Audio). No microphone, camera, location, ads, accounts, or in-app purchases. Settings are stored in localStorage on device only.

On the iOS app, audio uses AVAudioSession playback category so the instrument can be heard even when the Ring/Silent switch is on; volume is adjusted with the device hardware buttons.

To test: launch the app, tap the canvas or Power button if shown, swipe horizontally to hear pitch glide. Try Settings (gear) to change instrument layers and scales.

## サブタイトル（30文字以内）

| 言語 | 文案 |
|------|------|
| en-US | Swipe to glide pitch |
| ja | スワイプで音程が流れる楽器 |
| zh-Hans | 滑动改变音高的乐器 |

## 掲載文言

正本は `scripts/store-locales.rb`（紹介ページ WP #1735 の本文・app-cp を反映）。`appstore-prepare-and-submit.rb` / `appstore-setup-app-info.rb` が参照。

API 反映:

```bash
cd /Users/tomippe/Cursor/gradatone
source ~/.apple-env && source .env
./scripts/appstore-sync-listing.sh $(cat version.txt)
```

## Google Play（Android TWA）

- 手順: [`google-play-setup.md`](google-play-setup.md)
- パッケージ: `jp.tomippe.gradatone`
- 掲載文言は `scripts/store-locales.rb` を `play-sync-listing.sh` で流用

## Connect Web で人間が確認すること

- アプリのプライバシー → データ収集「いいえ」（個人データを収集しない）
- スクリーンショット（6.7" iPhone 必須、`ss/` 準備後）
- 初回 IPA アップロード後 → ビルド選択 → 審査提出

## バージョン履歴（app-versions・WordPress）

初回行の例:

| 日付 | バージョン | 内容 |
|------|------------|------|
| 2026.05.23 | v1.2.0 | iOS App Store 版 初回リリース準備 |
