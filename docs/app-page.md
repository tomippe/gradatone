# Gradatone 紹介ページ設定

- WordPress 投稿 ID: **1735**
- URL: https://apps.tomippe.jp/gradatone/
- Connect: https://appstoreconnect.apple.com/apps/6772448588/distribution

## ACF（更新方針）

| フィールド | 値 |
|------------|-----|
| platform | `["web", "ios"]` |
| app-webdesc | `Web / PWA<br>English`（PWA は Safari で消音スイッチの影響を受ける場合あり） |
| app-iosdesc | `iOS 15+, App Store<br>English` |
| app-iosurl | Connect 公開後の App Store URL を設定 |

**変更理由（2026-05）**: 旧 `app-webdesc`「消音モードをオフにしてください」は iOS アプリ版（消音スイッチ ON でも演奏可）と矛盾するため更新。

## app-cp（現状）

繊細な音程のニュアンスに、人間味を込めて  
自由に奏でる無限音階のメロディ

## REST 更新例

```bash
source ~/.wp-env && source .env
curl -sS -u "$WP_USER:$WP_APP_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{"acf":{"platform":["web","ios"],"app-webdesc":"Web / PWA<br>English","app-iosdesc":"iOS 15+, App Store<br>English"}}' \
  "$WP_SITE_URL/wp-json/wp/v2/app/$WP_APP_POST_ID"
```

## プライバシーポリシー

- 投稿 ID: **2315**
- URL: https://apps.tomippe.jp/gradatone/policy/
- 下書き: [privacy-policy-draft.md](privacy-policy-draft.md)
