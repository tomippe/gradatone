# Gradatone — ストア配布

- ルートの PWA は `build.sh` → FTP（`https://apps.tomippe.jp/gradatone/`）
- iOS は `native/ios/build.sh` → TestFlight / App Store（`store-web` 同梱）
- Android は `native/android/build.sh` → Google Play（TWA・本番 URL を表示）

```bash
npm run build:store-web
cd native/ios && npm install && npx cap add ios   # 初回のみ
./native/ios/build.sh -cm "TestFlight"

# Android（初回: Play Console で jp.tomippe.gradatone を作成、署名設定後）
./native/android/build.sh -skip-react
```

- iOS Connect: https://appstoreconnect.apple.com/apps/6772448588/distribution
- Android 手順: [`docs/google-play-setup.md`](../docs/google-play-setup.md)
