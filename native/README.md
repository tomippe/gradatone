# Gradatone — ストア配布

- ルートの PWA は `build.sh` → FTP（`https://apps.tomippe.jp/gradatone/`）
- iOS は `native/ios/build.sh` → TestFlight / App Store（`store-web` 同梱）
- Android は `native/android/build.sh` → Google Play（TWA・本番 URL を表示）

```bash
# 統合（Web + iOS + Android）
./build.sh -cm "メッセージ"

# iOS のみ
./native/ios/build.sh -cm "TestFlight"

# Android のみ
./native/android/build.sh -skip-react
```

- iOS Connect: https://appstoreconnect.apple.com/apps/6772448588/distribution
- Android 手順: [`docs/google-play-setup.md`](../docs/google-play-setup.md)
