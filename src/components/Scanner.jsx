import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, Search, X, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { getProductByBarcode } from "../services/productService";

const SCANNER_ID = "smartcart-barcode-reader";

// Audio synthesized scan beep
const playScanBeep = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1800, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  } catch {
    // Non-blocking
  }
};

// Popular mock barcodes for rapid 1-tap testing
const QUICK_TEST_BARCODES = [
  { barcode: "8900000000001", name: "Rusks 1L", price: 259, icon: "🥖" },
  { barcode: "8900000000002", name: "Noodles 2kg", price: 683, icon: "🍜" },
  { barcode: "8900000000004", name: "Fresh Milk", price: 2175, icon: "🥛" },
  { barcode: "8900000000006", name: "Dal Fanta", price: 277, icon: "🥫" },
  { barcode: "8900000000013", name: "Crispy Chips", price: 2458, icon: "🥔" },
  { barcode: "8900000000024", name: "Chocolate Pack", price: 2492, icon: "🍫" },
];

const Scanner = ({ onProductFound }) => {
  const inputRef = useRef(null);
  const scannerRef = useRef(null);
  const processingRef = useRef(false);

  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [error, setError] = useState("");
  const [recentScannedName, setRecentScannedName] = useState("");

  /* Focus manual input when camera is off */
  useEffect(() => {
    if (!cameraActive && !cameraStarting) {
      inputRef.current?.focus();
    }
  }, [cameraActive, cameraStarting]);

  /* Cleanup camera on unmount */
  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      if (!scanner) return;
      const cleanup = async () => {
        try {
          if (scanner.isScanning) await scanner.stop();
          await scanner.clear();
        } catch (err) {
          console.error("Scanner cleanup error:", err);
        }
      };
      cleanup();
    };
  }, []);

  const processBarcode = async (value) => {
    const scannedBarcode = String(value || "").trim();
    if (!scannedBarcode || processingRef.current) return;

    try {
      processingRef.current = true;
      setLoading(true);
      setError("");

      const data = await getProductByBarcode(scannedBarcode);

      if (!data.success || !data.product) {
        throw new Error(`Product not found for barcode ${scannedBarcode}`);
      }

      playScanBeep();
      setRecentScannedName(data.product.name);
      onProductFound(data.product);
      setBarcode("");
    } catch (err) {
      console.error("Product lookup error:", err);
      setError(err?.message || "Item not found in store database.");
      setBarcode("");
    } finally {
      setLoading(false);
      setTimeout(() => {
        processingRef.current = false;
      }, 700);
    }
  };

  const stopCamera = async () => {
    const scanner = scannerRef.current;
    if (!scanner) {
      setCameraActive(false);
      setCameraStarting(false);
      return;
    }

    try {
      if (scanner.isScanning) await scanner.stop();
      await scanner.clear();
    } catch (err) {
      console.error("Camera stop error:", err);
    }

    scannerRef.current = null;
    setCameraActive(false);
    setCameraStarting(false);
  };

  const startCamera = async () => {
    if (cameraActive || cameraStarting || loading || scannerRef.current) return;

    let scanner = null;
    try {
      setError("");
      setCameraStarting(true);

      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });

      const scannerElement = document.getElementById(SCANNER_ID);
      if (!scannerElement) {
        throw new Error("Scanner viewport element was not found.");
      }

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        throw new Error("No camera detected on this device.");
      }

      let cameraId = cameras[0].id;
      const backCamera = cameras.find((cam) => {
        const lbl = String(cam.label || "").toLowerCase();
        return lbl.includes("back") || lbl.includes("rear") || lbl.includes("environment");
      });
      if (backCamera) cameraId = backCamera.id;

      scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;

      await scanner.start(
        cameraId,
        {
          fps: 20,
          qrbox: { width: 280, height: 160 },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
        },
        async (decodedText) => {
          if (processingRef.current) return;
          const scanned = String(decodedText || "").trim();
          if (!scanned) return;

          processingRef.current = true;
          await stopCamera();
          processingRef.current = false;
          await processBarcode(scanned);
        },
        () => {}
      );

      setCameraStarting(false);
      setCameraActive(true);
    } catch (err) {
      console.error("Camera start error:", err);
      if (scanner) {
        try {
          if (scanner.isScanning) await scanner.stop();
          await scanner.clear();
        } catch {
          // ignore
        }
      }
      scannerRef.current = null;
      setCameraActive(false);
      setCameraStarting(false);

      if (err?.name === "NotAllowedError") {
        setError("Camera permission denied. Please allow camera access in browser settings.");
      } else {
        setError(err?.message || "Unable to start camera on this device.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!barcode.trim() || loading || cameraActive || cameraStarting) return;
    await processBarcode(barcode);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  return (
    <div className="w-full space-y-4">
      {/* =========================================================
          CAMERA SCANNING PORTAL
      ========================================================== */}
      {(cameraActive || cameraStarting) && (
        <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500 bg-slate-950 shadow-xl">
          {/* Top Camera Controls Overlay */}
          <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-4 text-white">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 items-center justify-center">
                <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold tracking-wide uppercase text-emerald-400">
                {cameraStarting ? "Initializing Camera" : "Barcode Auto-Detection Active"}
              </span>
            </div>

            <button
              onClick={stopCamera}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md active:scale-95 transition"
              aria-label="Close camera"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Html5Qrcode video canvas container */}
          <div className="relative">
            <div id={SCANNER_ID} className="min-h-[280px] w-full overflow-hidden" />

            {/* Custom Optical Viewfinder Reticle Overlay */}
            {!cameraStarting && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                <div className="relative h-40 w-64 rounded-2xl border-2 border-emerald-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                  {/* Corner Targets */}
                  <span className="absolute -top-1.5 -left-1.5 h-4 w-4 border-t-4 border-l-4 border-emerald-400" />
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 border-t-4 border-r-4 border-emerald-400" />
                  <span className="absolute -bottom-1.5 -left-1.5 h-4 w-4 border-b-4 border-l-4 border-emerald-400" />
                  <span className="absolute -bottom-1.5 -right-1.5 h-4 w-4 border-b-4 border-r-4 border-emerald-400" />

                  {/* Laser Scanning Line */}
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-[bounce_2s_infinite]" />
                </div>
              </div>
            )}
          </div>

          {/* Bottom helper inside camera */}
          <div className="bg-slate-900/90 px-4 py-3 text-center text-xs text-slate-300 backdrop-blur-md">
            Align barcode inside the frame · Hold steady for instant scan
          </div>
        </div>
      )}

      {/* =========================================================
          TOUCH SCAN CONTROLS (Camera Button & Manual Input)
      ========================================================== */}
      <div className="space-y-3">
        {/* Big Tap Camera CTA (Thumb zone optimized) */}
        {!cameraActive && !cameraStarting && (
          <button
            type="button"
            onClick={startCamera}
            disabled={loading}
            className="group relative flex w-full min-h-[52px] items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-3.5 font-bold text-white shadow-md shadow-emerald-700/20 active:scale-[0.98] transition-all hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50"
          >
            <Camera className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span className="text-sm">Tap to Open Barcode Scanner</span>
            <span className="rounded-md bg-emerald-800/60 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
              Live Lens
            </span>
          </button>
        )}

        {/* Manual Barcode Search Bar */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <input
              ref={inputRef}
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Or type/paste barcode (e.g. 8900000000001)"
              autoComplete="off"
              disabled={loading || cameraActive || cameraStarting}
              className="w-full min-h-[46px] rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
            />
            {barcode && (
              <button
                type="button"
                onClick={() => setBarcode("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || cameraActive || cameraStarting || !barcode.trim()}
            className="flex min-h-[46px] min-w-[80px] items-center justify-center gap-1.5 rounded-2xl bg-slate-900 px-4 text-xs font-bold text-white transition active:scale-95 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
          </button>
        </form>
      </div>

      {/* =========================================================
          QUICK 1-TAP TEST CHIPS (Instant testing on mobile/desktop)
      ========================================================== */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            <span>Quick Test Barcodes</span>
          </div>
          <span className="text-[10px] text-slate-400">Tap any item to test scan</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
          {QUICK_TEST_BARCODES.map((item) => (
            <button
              key={item.barcode}
              type="button"
              onClick={() => processBarcode(item.barcode)}
              disabled={loading}
              className="group flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:border-emerald-300 hover:bg-emerald-50/60 active:scale-95 disabled:opacity-50"
            >
              <span className="text-base">{item.icon}</span>
              <div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                  {item.name}
                </p>
                <p className="text-[10px] text-slate-500 tabular-nums">
                  ₹{item.price} · <span className="font-mono">{item.barcode.slice(-4)}</span>
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================
          STATUS FEEDBACK (Success Toast or Error)
      ========================================================== */}
      {recentScannedName && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <div className="min-w-0 flex-1">
            <span className="font-bold">Scanned & Added:</span> {recentScannedName}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">✓ In Cart</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <p className="min-w-0 flex-1">{error}</p>
          <button
            onClick={() => setError("")}
            className="text-rose-500 hover:text-rose-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Scanner;