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
        pushSafeAreaInsetsToWeb()
        setNeedsUpdateOfScreenEdgesDeferringSystemGestures()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        pushSafeAreaInsetsToWeb()
    }

    override func viewSafeAreaInsetsDidChange() {
        super.viewSafeAreaInsetsDidChange()
        pushSafeAreaInsetsToWeb()
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

    /// WKWebView では env(safe-area-inset-*) が 0 になりやすいため、UIKit の値を CSS 変数へ渡す
    private func pushSafeAreaInsetsToWeb() {
        guard let webView = webView else { return }
        let insets = view.safeAreaInsets
        let js = """
        (function(){
          var s=document.documentElement.style;
          s.setProperty('--safe-top','\(insets.top)px');
          s.setProperty('--safe-right','\(insets.right)px');
          s.setProperty('--safe-bottom','\(insets.bottom)px');
          s.setProperty('--safe-left','\(insets.left)px');
          window.dispatchEvent(new Event('gradatone-safe-area'));
        })();
        """
        webView.evaluateJavaScript(js, completionHandler: nil)
    }
}
