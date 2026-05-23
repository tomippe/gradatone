# frozen_string_literal: true

# App Store / Play 掲載文言の単一ソース
# 紹介ページ: https://apps.tomippe.jp/gradatone/ （WP app #1735）
# 更新時は本文・app-cp と突き合わせる

STORE_LOCALES = {
  "ja" => {
    play_language: "ja-JP",
    title: "Gradatone",
    subtitle: "スワイプで音程が流れる楽器",
    short_description: "スワイプで音程が流れる、シームレスなタッチ楽器。",
    promotional_text: "繊細な音程のニュアンスに、人間味を込めて。自由に奏でる無限音階のタッチ楽器。",
    keywords: "楽器,ピアノ,グリッサンド,音楽,演奏,シンセ,タッチ,音階,メロディ,gradatone",
    full_description: <<~TEXT.strip,
      Gradatone（グラデートーン）は、画面をスワイプするだけで音程が滑らかに移動するシームレスなピッチ楽器です。音のグラデーションから名付けました。

      鍵盤楽器では出せない微妙なニュアンスで、感情豊かな演奏が可能です。人の声や弦楽器のような、自然な音の揺れやグリッサンドを表現できます。

      複数の音色を重ねれば豊かなハーモニーも作れます。Snap をオンにすれば、音程が近い音階にふわりと引き寄せられます。メジャー・マイナーはもちろん、沖縄・都節、中国五音、インド（ラガ）、アラビア、ブルースなど多彩な音階に対応。ラベルは英語・かな・インド音名（स/प）などから選べます。

      楽器経験がなくても、タッチ操作だけで直感的に音楽を楽しめます。ピアノ、弦楽器、シンセ、民族楽器など多数の音色を内蔵しています。

      アカウント登録、広告、課金、トラッキングはありません。設定は端末内にのみ保存されます。

      iOS アプリ版では消音スイッチがオンのままでも演奏できます（音量は端末のボタンで調整）。
    TEXT
    whats_new: <<~TEXT.strip,
      - iOS 版を App Store で初めて公開
      - セーフエリアと下端 UI を端末表示に合わせて改善
      - タッチ位置と音程・ガイド線の一致を改善
      - 消音スイッチがオンのままでも演奏しやすく調整
      - 高速連打でも音が欠けにくく、応答を改善
      - 音階（インド・アラビアなど）と音名ラベルを復元
    TEXT
    support_url: "https://apps.tomippe.jp/gradatone/"
  },
  "en-US" => {
    play_language: "en-US",
    title: "Gradatone",
    subtitle: "Swipe to glide pitch",
    short_description: "A seamless touch instrument—swipe to glide pitch.",
    promotional_text: "Expressive pitch nuance with a human feel. A touch instrument on an endless scale.",
    keywords: "instrument,piano,glissando,music,play,synth,touch,scale,melody,gradatone",
    full_description: <<~TEXT.strip,
      Gradatone is a seamless pitch instrument: swipe the screen and hear pitch move smoothly—named for the gradient of sound.

      Play with nuance keyboards cannot easily offer—vocal-like vibrato and string-like glissandos. Layer timbres for rich harmony, or turn on Snap to pull pitch gently toward a scale.

      Choose from major, minor, Okinawan and Miyako modes, Chinese pentatonic, Indian (raga), Arabic, blues, and more. Labels include English, kana, and Indian note names (Sa/Pa).

      No account, ads, in-app purchases, or tracking. Settings stay on your device only.

      On iOS, you can play even when the Ring/Silent switch is on (use the device volume buttons).
    TEXT
    whats_new: <<~TEXT.strip,
      - First App Store release for iOS
      - Safe area and bottom controls aligned with the device
      - Touch position now matches pitch and guide lines
      - Easier to hear audio when the Ring/Silent switch is on
      - Faster taps register more reliably with lower latency
      - Restored scale list (including Indian and Arabic) and note labels
    TEXT
    support_url: "https://apps.tomippe.jp/gradatone/"
  },
  "zh-Hans" => {
    play_language: "zh-CN",
    title: "Gradatone",
    subtitle: "滑动改变音高的乐器",
    short_description: "滑动屏幕，音高平滑变化的触摸乐器。",
    promotional_text: "细腻音程，富有表现力。在无限音阶上自由演奏的触摸乐器。",
    keywords: "乐器,钢琴,滑音,音乐,演奏,合成器,触摸,音阶,旋律,gradatone",
    full_description: <<~TEXT.strip,
      Gradatone 是一款无缝音高乐器：在屏幕上滑动，音高平滑移动——名字来自声音的渐变。

      可表现传统键盘难以做到的细微音程、类似人声或弦乐的颤音与滑音。叠加多种音色营造丰富和声，开启 Snap 可将音高轻轻吸附到音阶。

      支持大调、小调、冲绳与都节、中国五声、印度（拉格）、阿拉伯、布鲁斯等音阶；音名标签可选英文、假名与印度音名（स/प）等。

      无需账号、广告、内购或追踪，设置仅保存在设备内。

      iOS 版在静音开关开启时也可演奏（请用设备音量键调节响度）。
    TEXT
    whats_new: <<~TEXT.strip,
      - iOS 版首次在 App Store 发布
      - 安全区域与底部控件随设备显示优化
      - 触摸位置与音高、引导线一致
      - 静音开关开启时也更易听到声音
      - 快速连按更易发声、延迟更低
      - 恢复音阶列表（含印度、阿拉伯等）与音名标签
    TEXT
    support_url: "https://apps.tomippe.jp/gradatone/"
  }
}.freeze

def store_version_localization_attrs(locale_key)
  data = STORE_LOCALES.fetch(locale_key)
  {
    description: data[:full_description],
    keywords: data[:keywords],
    promotionalText: data[:promotional_text],
    whatsNew: data[:whats_new],
    supportUrl: data[:support_url]
  }
end
