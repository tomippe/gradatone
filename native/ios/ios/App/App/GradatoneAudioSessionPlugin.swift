import Foundation
import Capacitor
import AVFoundation

enum GradatoneAudioSession {
    private static var routeChangeObserver: NSObjectProtocol?

    /// 消音スイッチ ON でも Web Audio が鳴るよう .playback を維持する
    static func activatePlaybackSession() {
        let session = AVAudioSession.sharedInstance()
        do {
            try applyPlaybackCategory(session)
            try session.setActive(true, options: [])
        } catch {
            NSLog("GradatoneAudioSession (first try): \(error.localizedDescription)")
            do {
                try session.setActive(false, options: .notifyOthersOnDeactivation)
                try applyPlaybackCategory(session)
                try session.setActive(true, options: [])
            } catch {
                NSLog("GradatoneAudioSession (retry): \(error.localizedDescription)")
            }
        }
        installRouteChangeObserverIfNeeded()
    }

    private static func applyPlaybackCategory(_ session: AVAudioSession) throws {
        // .ambient / .soloAmbient だと消音スイッチで無音になる
        try session.setCategory(
            .playback,
            mode: .default,
            options: [.defaultToSpeaker, .allowBluetoothA2DP]
        )
    }

    private static func installRouteChangeObserverIfNeeded() {
        guard routeChangeObserver == nil else { return }
        routeChangeObserver = NotificationCenter.default.addObserver(
            forName: AVAudioSession.routeChangeNotification,
            object: AVAudioSession.sharedInstance(),
            queue: .main
        ) { _ in
            activatePlaybackSession()
        }
    }
}

@objc(GradatoneAudioSessionPlugin)
public class GradatoneAudioSessionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "GradatoneAudioSessionPlugin"
    public let jsName = "GradatoneAudioSession"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "configure", returnType: CAPPluginReturnPromise)
    ]

    private static var interruptionObserver: NSObjectProtocol?

    public override func load() {
        GradatoneAudioSession.activatePlaybackSession()
        Self.installInterruptionObserverIfNeeded()
    }

    @objc func configure(_ call: CAPPluginCall) {
        GradatoneAudioSession.activatePlaybackSession()
        call.resolve()
    }

    private static func installInterruptionObserverIfNeeded() {
        guard interruptionObserver == nil else { return }
        interruptionObserver = NotificationCenter.default.addObserver(
            forName: AVAudioSession.interruptionNotification,
            object: AVAudioSession.sharedInstance(),
            queue: .main
        ) { notification in
            guard
                let typeValue = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
                let type = AVAudioSession.InterruptionType(rawValue: typeValue)
            else { return }

            if type == .ended {
                GradatoneAudioSession.activatePlaybackSession()
            }
        }
    }
}
