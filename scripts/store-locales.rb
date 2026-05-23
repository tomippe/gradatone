# frozen_string_literal: true

# App Store / 将来 Play 用の掲載文言（単一ソース）
STORE_LOCALES = {
  "ja" => {
    play_language: "ja-JP",
    title: "Gradatone",
    short_description: "スワイプで音程が流れる、シームレスなタッチ楽器。",
    full_description: <<~TEXT.strip,
      Gradatone は、画面をスワイプするだけで音程が滑らかに変化するシームレスなピッチ楽器です。従来の鍵盤では難しい連続的なグリッサンドや、微妙なニュアンスの表現が可能です。

      複数の楽器レイヤーを重ねて豊かなハーモニーを作ったり、Snap をオンにして音階に寄せたりできます。アカウント登録、広告、課金、トラッキングはありません。
    TEXT
    whats_new: "App Store 版の初回リリース準備。"
  },
  "en-US" => {
    play_language: "en-US",
    title: "Gradatone",
    short_description: "A seamless touch instrument—swipe to glide pitch.",
    full_description: <<~TEXT.strip,
      Gradatone is a seamless pitch instrument: swipe the screen and hear notes glide smoothly. Layer instruments, use Snap for scales, and explore without accounts, ads, or tracking.
    TEXT
    whats_new: "Initial App Store release preparation."
  },
  "zh-Hans" => {
    play_language: "zh-CN",
    title: "Gradatone",
    short_description: "滑动屏幕，音高平滑变化的触摸乐器。",
    full_description: <<~TEXT.strip,
      Gradatone 让你在屏幕上滑动即可平滑改变音高，叠加多种音色，无需账号、广告或追踪。
    TEXT
    whats_new: "App Store 版首次发布准备。"
  }
}.freeze
