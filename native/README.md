# Gradatone — ストア配布

- ルートの PWA は `build.sh` → FTP
- iOS は `native/ios/build.sh` → TestFlight / App Store

```bash
npm run build:store-web
cd native/ios && npm install && npx cap add ios   # 初回のみ
./native/ios/build.sh -cm "TestFlight"
```

Connect: https://appstoreconnect.apple.com/apps/6772448588/distribution
