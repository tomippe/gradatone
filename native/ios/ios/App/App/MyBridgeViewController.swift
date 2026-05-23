import UIKit
import Capacitor

class MyBridgeViewController: CAPBridgeViewController {
    /// 上下端スワイプで通知センター／コントロールセンターが先に出ないよう、端のシステムジェスチャーを遅延する
    override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge {
        return .all
    }

    /// 下端のホームインジケーター領域でも演奏優先（必要なら上スワイプで一時表示）
    override var prefersHomeIndicatorAutoHidden: Bool {
        return true
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        GradatoneAudioSession.activatePlaybackSession()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        GradatoneAudioSession.activatePlaybackSession()
        configureEdgeToEdgeWebView()
        setNeedsUpdateOfScreenEdgesDeferringSystemGestures()
    }

    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(GradatoneAudioSessionPlugin())
        GradatoneAudioSession.activatePlaybackSession()
        configureEdgeToEdgeWebView()
    }

    private func configureEdgeToEdgeWebView() {
        guard let webView = webView else { return }
        let scrollView = webView.scrollView
        scrollView.contentInsetAdjustmentBehavior = .never
        scrollView.contentInset = .zero
        scrollView.scrollIndicatorInsets = .zero
        scrollView.bounces = false
        scrollView.alwaysBounceVertical = false
        scrollView.alwaysBounceHorizontal = false
    }
}
