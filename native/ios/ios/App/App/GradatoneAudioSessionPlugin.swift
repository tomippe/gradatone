import Foundation
import Capacitor
import AVFoundation

enum GradatoneAudioSession {
    static func activatePlaybackSession() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playback, mode: .default, options: [])
            try session.setActive(true, options: [])
        } catch {
            NSLog("GradatoneAudioSession: \(error.localizedDescription)")
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
