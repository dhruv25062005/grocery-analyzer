import { useState } from "react";
import { Download, Share2, PlusSquare, X, Smartphone } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";

export const PWAInstallButton = ({ className = "" }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed and running standalone, suppress button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex min-h-[38px] items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95 ${className}`}
        aria-label="Install SmartCart Mobile App"
      >
        <Download className="h-3.5 w-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition ${className}`}
          aria-label="Install SmartCart on iOS"
        >
          <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
                <Smartphone className="h-6 w-6" />
              </div>

              <h3 className="text-base font-extrabold text-slate-900 text-center">
                Install SmartCart on iPhone
              </h3>
              <p className="mt-1 text-xs text-slate-500 text-center">
                Install SmartCart to scan grocery barcodes in full-screen standalone mode.
              </p>

              <div className="mt-4 space-y-2.5 rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-700 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white shadow-2xs text-slate-700">
                    <Share2 className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <span>1. Tap the <strong>Share</strong> button in Safari toolbar.</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white shadow-2xs text-slate-700">
                    <PlusSquare className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <span>2. Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-2xl bg-slate-900 py-3 text-xs font-bold text-white transition active:scale-95"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for desktop/browsers where beforeinstallprompt hasn't fired yet or preview iframe
  return (
    <button
      onClick={() => {
        alert?.("To install SmartCart on your device, open your browser menu (⋮ or Share) and select 'Add to Home Screen' / 'Install app'.");
      }}
      className={`hidden sm:flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition ${className}`}
      title="Install on Mobile Device"
    >
      <Download className="h-3.5 w-3.5 text-emerald-600" />
      <span>Install App</span>
    </button>
  );
};
