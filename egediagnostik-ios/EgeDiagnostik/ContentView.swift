import SwiftUI
import WebKit

struct ContentView: View {
    @State private var exited = false

    var body: some View {
        Group {
            if exited {
                VStack(spacing: 18) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 54))
                    Text("Ege Diagnostik")
                        .font(.title2.bold())
                    Text("Oturum kapatıldı. iOS uygulamaların kendi kendini sonlandırmasına izin vermez. Uygulamayı kapatmak için ana ekrana dönebilirsiniz.")
                        .multilineTextAlignment(.center)
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 28)
                    Button("Uygulamaya Dön") {
                        exited = false
                    }
                    .buttonStyle(.borderedProminent)
                }
            } else {
                EgeWebView(exited: $exited)
                    .ignoresSafeArea(.container, edges: .bottom)
            }
        }
    }
}

struct EgeWebView: UIViewRepresentable {
    @Binding var exited: Bool
    private let startURL = URL(string: "https://egediagnostik.com")!

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .automatic

        var request = URLRequest(url: startURL)
        request.cachePolicy = .useProtocolCachePolicy
        webView.load(request)
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        private var parent: EgeWebView

        init(_ parent: EgeWebView) {
            self.parent = parent
        }

        func webView(_ webView: WKWebView,
                     decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            if let url = navigationAction.request.url,
               url.absoluteString.lowercased() == "app-exit://close" {
                webView.stopLoading()
                DispatchQueue.main.async {
                    self.parent.exited = true
                }
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }

        @available(iOS 15.0, *)
        func webView(_ webView: WKWebView,
                     requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                     initiatedByFrame frame: WKFrameInfo,
                     type: WKMediaCaptureType,
                     decisionHandler: @escaping (WKPermissionDecision) -> Void) {
            let host = origin.host.lowercased()
            if host == "egediagnostik.com" || host == "www.egediagnostik.com" {
                decisionHandler(.grant)
            } else {
                decisionHandler(.prompt)
            }
        }

        func webView(_ webView: WKWebView,
                     createWebViewWith configuration: WKWebViewConfiguration,
                     for navigationAction: WKNavigationAction,
                     windowFeatures: WKWindowFeatures) -> WKWebView? {
            if navigationAction.targetFrame == nil,
               let url = navigationAction.request.url {
                webView.load(URLRequest(url: url))
            }
            return nil
        }
    }
}
