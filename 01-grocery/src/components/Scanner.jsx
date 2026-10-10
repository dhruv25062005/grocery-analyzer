import { useCallback, useEffect, useRef, useState } from "react";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";

import { getProductByBarcode } from "../services/productService";

const SCANNER_ID = "smartcart-barcode-reader";

const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.ITF,
];

const Icon = ({ name, className = "h-5 w-5" }) => {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    camera: (
      <>
        <path d="M14 4H8L6 7H3v13h18V7h-3l-2-3Z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),
    barcode: (
      <>
        <path d="M3 5v14M6 5v14M9 5v14M13 5v14M15 5v14M19 5v14M21 5v14" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
    check: <path d="m5 12 4 4L19 6" />,
    refresh: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M4 17v-5h5" />
        <path d="M5.5 9a7 7 0 0 1 11.6-2L20 12M4 12l2.9 5a7 7 0 0 0 11.6-2" />
      </>
    ),
    alert: (
      <>
        <path d="m12 3 10 18H2L12 3Z" />
        <path d="M12 9v4m0 4h.01" />
      </>
    ),
    keyboard: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 15h8" />
      </>
    ),
  };

  return <svg {...common}>{paths[name] || paths.check}</svg>;
};

const getLookupError = (err) => {
  const message = String(err?.message || "");

  if (
    err?.name === "TypeError" ||
    /failed to fetch|networkerror|load failed|internet disconnected/i.test(
      message
    )
  ) {
    return "Unable to connect to the product server. Check your internet connection and backend API, then try again.";
  }

  if (/not found|no product|404/i.test(message)) {
    return "No product matches this barcode. Check the barcode or add the product to your inventory first.";
  }

  return message || "Unable to find this product. Please try again.";
};

const Scanner = ({ onProductFound }) => {
  const inputRef = useRef(null);
  const scannerRef = useRef(null);
  const processingRef = useRef(false);
  const mountedRef = useRef(false);
  const cameraOperationRef = useRef(false);
  const lookupSequenceRef = useRef(0);

  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [detectedBarcode, setDetectedBarcode] = useState("");
  const [lastFoundProduct, setLastFoundProduct] = useState(null);

  // Focus manual input when the camera is not in use.
  useEffect(() => {
    if (!cameraActive && !cameraStarting && !loading) {
      inputRef.current?.focus();
    }
  }, [cameraActive, cameraStarting, loading]);

  // Safely stop and release the camera when the component unmounts.
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      lookupSequenceRef.current += 1;

      const scanner = scannerRef.current;
      scannerRef.current = null;

      if (scanner) {
        const cleanup = async () => {
          try {
            if (scanner.isScanning) {
              await scanner.stop();
            }
          } catch (err) {
            console.debug("Scanner cleanup:", err);
          }

          try {
            await scanner.clear();
          } catch (err) {
            console.debug("Scanner release:", err);
          }
        };

        void cleanup();
      }
    };
  }, []);

  // Product lookup shared by the camera and manual scanner.
  const processBarcode = useCallback(
    async (value) => {
      const scannedBarcode = String(value || "").trim();

      if (!scannedBarcode || processingRef.current) {
        return;
      }

      processingRef.current = true;
      const requestId = ++lookupSequenceRef.current;

      setLoading(true);
      setError("");
      setNotice("");
      setDetectedBarcode(scannedBarcode);
      setLastFoundProduct(null);

      try {
        const data = await getProductByBarcode(scannedBarcode);

        if (!mountedRef.current || requestId !== lookupSequenceRef.current) {
          return;
        }

        if (!data?.success || !data?.product) {
          throw new Error(
            `Product not found for barcode: ${scannedBarcode}`
          );
        }

        const product = data.product;

        setLastFoundProduct(product);
        setNotice(`${product.name || "Product"} found successfully.`);

        if (typeof onProductFound === "function") {
          onProductFound(product);
        }

        setBarcode("");
      } catch (err) {
        console.error("Product lookup error:", err);

        if (mountedRef.current && requestId === lookupSequenceRef.current) {
          setError(getLookupError(err));
          setBarcode("");
        }
      } finally {
        if (mountedRef.current && requestId === lookupSequenceRef.current) {
          setLoading(false);
        }

        processingRef.current = false;
      }
    },
    [onProductFound]
  );

  // Stop the active camera and release the scanner.
  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;

    if (!scanner) {
      if (mountedRef.current) {
        setCameraActive(false);
        setCameraStarting(false);
      }
      return;
    }

    scannerRef.current = null;

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch (err) {
      console.debug("Camera stop:", err);
    }

    try {
      await scanner.clear();
    } catch (err) {
      console.debug("Scanner clear:", err);
    }

    if (mountedRef.current) {
      setCameraActive(false);
      setCameraStarting(false);
    }
  }, []);

  // Start the webcam barcode scanner.
  const startCamera = useCallback(async () => {
    if (
      cameraOperationRef.current ||
      cameraActive ||
      cameraStarting ||
      loading ||
      scannerRef.current
    ) {
      return;
    }

    cameraOperationRef.current = true;
    setError("");
    setNotice("");
    setDetectedBarcode("");
    setCameraStarting(true);

    let scanner = null;

    try {
      if (!window.isSecureContext) {
        throw new Error(
          "Camera access requires HTTPS or localhost. Open SmartCart on localhost for local testing."
        );
      }

      // Wait for React to render the scanner container.
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });

      if (!mountedRef.current) return;

      const element = document.getElementById(SCANNER_ID);

      if (!element) {
        throw new Error("The scanner area could not be initialized.");
      }

      const cameras = await Html5Qrcode.getCameras();

      if (!cameras?.length) {
        throw new Error("No camera was detected on this device.");
      }

      // Prefer the rear camera on phones.
      const preferredCamera = cameras.find((camera) =>
        /back|rear|environment|world/i.test(camera.label || "")
      );

      const cameraId = (preferredCamera || cameras[0]).id;

      scanner = new Html5Qrcode(SCANNER_ID, {
        formatsToSupport: BARCODE_FORMATS,
        verbose: false,
      });

      scannerRef.current = scanner;

      await scanner.start(
        cameraId,
        {
          fps: 12,
          qrbox: (viewWidth, viewHeight) => ({
            width: Math.min(320, Math.floor(viewWidth * 0.9)),
            height: Math.min(130, Math.floor(viewHeight * 0.65)),
          }),
          aspectRatio: 1.7778,
          disableFlip: false,
        },
        async (decodedText) => {
          if (
            processingRef.current ||
            !mountedRef.current ||
            scannerRef.current !== scanner
          ) {
            return;
          }

          const value = String(decodedText || "").trim();

          if (!value) return;

          // Lock immediately so multiple frames cannot add the same scan.
          processingRef.current = true;
          setDetectedBarcode(value);
          setNotice("Barcode detected. Looking up product...");

          await stopCamera();

          // processBarcode acquires its own lock.
          processingRef.current = false;

          await processBarcode(value);
        },
        () => {
          // No barcode in this frame is normal; keep scanning.
        }
      );

      if (mountedRef.current) {
        setCameraActive(true);
        setCameraStarting(false);
        setNotice("Camera ready. Place a barcode inside the scanning area.");
      }
    } catch (err) {
      console.error("Camera start error:", err);

      if (scanner) {
        if (scannerRef.current === scanner) {
          scannerRef.current = null;
        }

        try {
          if (scanner.isScanning) {
            await scanner.stop();
          }
        } catch {
          // Ignore cleanup errors after a failed start.
        }

        try {
          await scanner.clear();
        } catch {
          // Ignore cleanup errors after a failed start.
        }
      }

      if (mountedRef.current) {
        let message = err?.message || "Unable to start the camera.";

        if (err?.name === "NotAllowedError") {
          message =
            "Camera permission was denied. Allow camera access in your browser settings.";
        } else if (err?.name === "NotFoundError") {
          message = "No compatible camera was found on this device.";
        } else if (err?.name === "NotReadableError") {
          message =
            "The camera is busy. Close other applications using it and try again.";
        } else if (err?.name === "OverconstrainedError") {
          message =
            "The selected camera does not support these settings. Try another camera.";
        }

        setError(message);
        setCameraActive(false);
        setCameraStarting(false);
      }
    } finally {
      cameraOperationRef.current = false;
    }
  }, [
    cameraActive,
    cameraStarting,
    loading,
    processBarcode,
    stopCamera,
  ]);

  // Manual entry and USB/Bluetooth scanners.
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading || cameraActive || cameraStarting) return;

    await processBarcode(barcode);

    if (mountedRef.current) {
      inputRef.current?.focus();
    }
  };

  const resetScanner = () => {
    setError("");
    setNotice("");
    setDetectedBarcode("");
    setLastFoundProduct(null);
    setBarcode("");

    if (!cameraActive && !cameraStarting && !loading) {
      inputRef.current?.focus();
    }
  };

  return (
    <section className="w-full space-y-5">
      {/* Scanner header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3ED] text-[#153D30]">
            <Icon name="barcode" className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#17231F]">
              Scan your products
            </h2>
            <p className="mt-1 text-sm text-[#718078]">
              Use your camera or a barcode scanner.
            </p>
          </div>
        </div>

        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#DCE8DF] bg-white px-3 py-1.5 text-xs font-semibold text-[#205541]">
          <span
            className={`h-2 w-2 rounded-full ${
              cameraActive
                ? "animate-pulse bg-emerald-500"
                : loading
                ? "animate-pulse bg-amber-500"
                : "bg-[#89968E]"
            }`}
          />
          {cameraActive
            ? "Camera active"
            : loading
            ? "Searching inventory"
            : "Ready to scan"}
        </span>
      </div>

      {/* Camera panel */}
      {(cameraActive || cameraStarting) && (
        <div className="overflow-hidden rounded-2xl border border-[#DCE5DE] bg-[#10251D]">
          <div className="flex items-center justify-between gap-3 px-4 py-4 text-white sm:px-5">
            <div>
              <p className="font-semibold">Live barcode scanner</p>
              <p className="mt-1 text-xs text-white/60">
                {cameraStarting
                  ? "Requesting camera access..."
                  : "Align the barcode inside the scan area."}
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#D9F99D]" />
              {cameraStarting ? "Starting" : "Live"}
            </span>
          </div>

          {/* html5-qrcode manages this element. */}
          <div
            id={SCANNER_ID}
            className="min-h-[240px] w-full overflow-hidden bg-black"
          />

          <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-white/60">
              Keep the barcode steady and well lit.
            </p>

            <button
              type="button"
              onClick={stopCamera}
              disabled={cameraStarting}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              <Icon name="stop" className="h-4 w-4" />
              Stop camera
            </button>
          </div>
        </div>
      )}

      {/* Scan controls */}
      <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
        {!cameraActive && !cameraStarting && (
          <button
            type="button"
            onClick={startCamera}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCE5DE] bg-white px-5 py-3.5 font-semibold text-[#153D30] transition hover:bg-[#F1F6F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D30] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon name="camera" />
            Scan with camera
          </button>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex min-w-0 gap-2 sm:gap-3"
        >
          <div className="relative min-w-0 flex-1">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#89968E]"
            />

            <input
              ref={inputRef}
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              value={barcode}
              onChange={(event) => setBarcode(event.target.value)}
              placeholder="Scan or enter barcode"
              aria-label="Product barcode"
              disabled={loading || cameraActive || cameraStarting}
              className="h-full min-h-[50px] w-full min-w-0 rounded-xl border border-[#DCE5DE] bg-white py-3 pl-11 pr-3 text-sm text-[#17231F] outline-none transition placeholder:text-[#9AA69F] focus:border-[#15803D] focus:ring-4 focus:ring-[#15803D]/10 disabled:cursor-not-allowed disabled:bg-[#F1F4F2]"
            />
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              cameraActive ||
              cameraStarting ||
              !barcode.trim()
            }
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#153D30] px-4 py-3 font-semibold text-white transition hover:bg-[#205541] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D30] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <Icon name="search" className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {loading ? "Searching..." : "Find product"}
            </span>
            <span className="sm:hidden">
              {loading ? "Wait..." : "Find"}
            </span>
          </button>
        </form>
      </div>

      {/* Detected barcode */}
      {detectedBarcode && (
        <div className="rounded-xl border border-[#DCE5DE] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#89968E]">
            Last detected barcode
          </p>
          <p className="mt-1 break-all font-mono text-lg font-bold text-[#153D30]">
            {detectedBarcode}
          </p>
        </div>
      )}

      {/* Success message */}
      {notice && !error && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="min-w-0 flex-1 leading-5">{notice}</div>
        </div>
      )}

      {/* Product lookup error */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <div className="flex items-start gap-3">
            <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-red-800">
                Unable to complete scan
              </p>
              <p className="mt-1 break-words text-sm leading-5 text-red-700">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={resetScanner}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
            >
              <Icon name="refresh" className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Last successful lookup */}
      {lastFoundProduct && (
        <div className="overflow-hidden rounded-2xl border border-[#DCE5DE] bg-white">
          <div className="flex items-center gap-3 border-b border-[#E2E9E4] bg-[#F7FAF7] p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D9F99D] text-[#153D30]">
              <Icon name="check" className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#15803D]">
                Product recognized
              </p>
              <p className="mt-1 break-words font-bold text-[#17231F]">
                {lastFoundProduct.name || "Product"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs text-[#89968E]">Unit price</p>
              <p className="mt-1 text-xl font-bold text-[#153D30]">
                ₹{Number(lastFoundProduct.price || 0).toFixed(2)}
              </p>
            </div>

            <button
              type="button"
              onClick={resetScanner}
              className="rounded-xl border border-[#DCE5DE] px-4 py-2.5 text-sm font-semibold text-[#153D30] transition hover:bg-[#F5F8F6]"
            >
              Scan another product
            </button>
          </div>
        </div>
      )}

      {/* Helpful instructions */}
      <div className="rounded-2xl border border-[#E2E9E4] bg-white p-4 sm:p-5">
        <h3 className="font-semibold text-[#17231F]">
          Scanning tips
        </h3>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <Icon name="camera" className="mt-0.5 h-5 w-5 shrink-0 text-[#205541]" />
            <div>
              <p className="text-sm font-medium text-[#17231F]">
                Use good lighting
              </p>
              <p className="mt-1 text-xs leading-5 text-[#718078]">
                Avoid glare and keep the barcode in focus.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Icon name="barcode" className="mt-0.5 h-5 w-5 shrink-0 text-[#205541]" />
            <div>
              <p className="text-sm font-medium text-[#17231F]">
                Align the barcode
              </p>
              <p className="mt-1 text-xs leading-5 text-[#718078]">
                Keep the complete barcode visible in the scan area.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Icon name="keyboard" className="mt-0.5 h-5 w-5 shrink-0 text-[#205541]" />
            <div>
              <p className="text-sm font-medium text-[#17231F]">
                Use manual entry
              </p>
              <p className="mt-1 text-xs leading-5 text-[#718078]">
                USB scanners and manual barcode entry are supported.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Scanner;
