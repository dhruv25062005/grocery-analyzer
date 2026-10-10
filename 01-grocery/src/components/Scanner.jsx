import { useEffect, useRef, useState } from "react";

import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";

import { getProductByBarcode } from "../services/productService";

const SCANNER_ID = "smartcart-barcode-reader";

const Scanner = ({ onProductFound }) => {
  const inputRef = useRef(null);
  const scannerRef = useRef(null);
  const processingRef = useRef(false);

  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);

  const [cameraActive, setCameraActive] =
    useState(false);

  const [cameraStarting, setCameraStarting] =
    useState(false);

  const [error, setError] = useState("");
  const [detectedBarcode, setDetectedBarcode] =
    useState("");

  /*
  ============================================================
  FOCUS MANUAL INPUT
  ============================================================
  */

  useEffect(() => {
    if (!cameraActive && !cameraStarting) {
      inputRef.current?.focus();
    }
  }, [cameraActive, cameraStarting]);

  /*
  ============================================================
  CLEANUP CAMERA
  ============================================================
  */

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;

      if (!scanner) {
        return;
      }

      const cleanup = async () => {
        try {
          if (scanner.isScanning) {
            await scanner.stop();
          }
        } catch (err) {
          console.error(
            "Scanner cleanup error:",
            err
          );
        }

        try {
          await scanner.clear();
        } catch (err) {
          console.error(
            "Scanner clear error:",
            err
          );
        }
      };

      cleanup();
    };
  }, []);

  /*
  ============================================================
  PRODUCT LOOKUP
  ============================================================
  */

  const processBarcode = async (value) => {
    const scannedBarcode =
      String(value || "").trim();

    if (
      !scannedBarcode ||
      processingRef.current
    ) {
      return;
    }

    try {
      processingRef.current = true;

      setLoading(true);
      setError("");
      setDetectedBarcode(
        scannedBarcode
      );

      console.log(
        "📷 Barcode detected:",
        scannedBarcode
      );

      const data =
        await getProductByBarcode(
          scannedBarcode
        );

      console.log(
        "📦 Product API response:",
        data
      );

      if (
        !data.success ||
        !data.product
      ) {
        throw new Error(
          `Product not found for barcode: ${scannedBarcode}`
        );
      }

      console.log(
        "✅ Product found:",
        data.product
      );

      onProductFound(
        data.product
      );

      setBarcode("");
    } catch (err) {
      console.error(
        "❌ Product lookup error:",
        err
      );

      setError(
        err?.message ||
          "Unable to find this product."
      );

      setBarcode("");
    } finally {
      setLoading(false);

      setTimeout(() => {
        processingRef.current =
          false;
      }, 800);
    }
  };

  /*
  ============================================================
  STOP CAMERA
  ============================================================
  */

  const stopCamera = async () => {
    const scanner =
      scannerRef.current;

    if (!scanner) {
      setCameraActive(false);
      setCameraStarting(false);
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch (err) {
      console.error(
        "Camera stop error:",
        err
      );
    }

    try {
      await scanner.clear();
    } catch (err) {
      console.error(
        "Scanner clear error:",
        err
      );
    }

    scannerRef.current = null;

    setCameraActive(false);
    setCameraStarting(false);

    console.log(
      "📷 Camera scanner stopped"
    );
  };

  /*
  ============================================================
  START CAMERA
  ============================================================
  */

  const startCamera = async () => {
    if (
      cameraActive ||
      cameraStarting ||
      loading ||
      scannerRef.current
    ) {
      return;
    }

    let scanner = null;

    try {
      setError("");
      setDetectedBarcode("");

      /*
      ----------------------------------------------------------
      STEP 1
      Show the scanner container FIRST.

      This is the important fix.
      ----------------------------------------------------------
      */

      setCameraStarting(true);

      /*
      ----------------------------------------------------------
      STEP 2
      Give React time to render the visible container.
      ----------------------------------------------------------
      */

      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });

      /*
      ----------------------------------------------------------
      STEP 3
      Find the scanner element.
      ----------------------------------------------------------
      */

      const scannerElement =
        document.getElementById(
          SCANNER_ID
        );

      if (!scannerElement) {
        throw new Error(
          "Scanner element was not found."
        );
      }

      console.log(
        "✅ Scanner element found"
      );

      /*
      ----------------------------------------------------------
      STEP 4
      Get available cameras.
      ----------------------------------------------------------
      */

      console.log(
        "📷 Detecting cameras..."
      );

      const cameras =
        await Html5Qrcode.getCameras();

      console.log(
        "📷 Available cameras:",
        cameras
      );

      if (
        !cameras ||
        cameras.length === 0
      ) {
        throw new Error(
          "No camera was detected on this computer."
        );
      }

      /*
      ----------------------------------------------------------
      STEP 5
      Select the best available camera.
      ----------------------------------------------------------
      */

      let cameraId =
        cameras[0].id;

      const preferredCamera =
        cameras.find(
          (camera) => {
            const label =
              String(
                camera.label || ""
              ).toLowerCase();

            return (
              label.includes("back") ||
              label.includes("rear") ||
              label.includes(
                "environment"
              )
            );
          }
        );

      if (preferredCamera) {
        cameraId =
          preferredCamera.id;
      }

      console.log(
        "📷 Selected camera:",
        cameraId
      );

      /*
      ----------------------------------------------------------
      STEP 6
      Create scanner.
      ----------------------------------------------------------
      */

      scanner =
        new Html5Qrcode(
          SCANNER_ID
        );

      scannerRef.current =
        scanner;

      /*
      ----------------------------------------------------------
      STEP 7
      Start scanner.

      The container is ALREADY visible here.
      ----------------------------------------------------------
      */

      await scanner.start(
        cameraId,
        {
          fps: 15,

          qrbox: {
            width: 300,
            height: 120,
          },

          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.ITF,
          ],
        },

        /*
        --------------------------------------------------------
        BARCODE DETECTED
        --------------------------------------------------------
        */

        async (decodedText) => {
          if (
            processingRef.current
          ) {
            return;
          }

          const scannedBarcode =
            String(
              decodedText || ""
            ).trim();

          if (!scannedBarcode) {
            return;
          }

          console.log(
            "🔎 Barcode detected:",
            scannedBarcode
          );

          processingRef.current =
            true;

          setDetectedBarcode(
            scannedBarcode
          );

          /*
          Stop camera BEFORE
          updating the React UI.
          */

          await stopCamera();

          processingRef.current =
            false;

          /*
          Lookup product.
          */

          await processBarcode(
            scannedBarcode
          );
        },

        /*
        --------------------------------------------------------
        NORMAL SCAN FAILURE
        --------------------------------------------------------

        html5-qrcode calls this continuously
        when no barcode is detected.

        We intentionally ignore it.
        */

        () => {}
      );

      /*
      ----------------------------------------------------------
      CAMERA SUCCESSFULLY STARTED
      ----------------------------------------------------------
      */

      setCameraStarting(false);
      setCameraActive(true);

      console.log(
        "✅ SmartCart camera started successfully"
      );
    } catch (err) {
      console.error(
        "❌ CAMERA ERROR:",
        err
      );

      console.error(
        "Camera error name:",
        err?.name
      );

      console.error(
        "Camera error message:",
        err?.message
      );

      /*
      ----------------------------------------------------------
      CLEANUP FAILED SCANNER
      ----------------------------------------------------------
      */

      if (scanner) {
        try {
          if (
            scanner.isScanning
          ) {
            await scanner.stop();
          }
        } catch (stopError) {
          console.error(
            "Scanner stop error:",
            stopError
          );
        }

        try {
          await scanner.clear();
        } catch (clearError) {
          console.error(
            "Scanner clear error:",
            clearError
          );
        }
      }

      scannerRef.current =
        null;

      setCameraActive(false);
      setCameraStarting(false);

      /*
      ----------------------------------------------------------
      DISPLAY USEFUL ERROR
      ----------------------------------------------------------
      */

      const name =
        err?.name || "";

      const message =
        String(
          err?.message || ""
        );

      if (
        name ===
        "NotAllowedError"
      ) {
        setError(
          "Camera permission was denied. Allow camera access for localhost in Chrome."
        );
      } else if (
        name ===
        "NotFoundError"
      ) {
        setError(
          "No camera was found on this computer."
        );
      } else if (
        name ===
        "NotReadableError"
      ) {
        setError(
          "The camera is already being used by another application."
        );
      } else if (
        name ===
        "OverconstrainedError"
      ) {
        setError(
          "The selected camera does not support the requested settings."
        );
      } else {
        setError(
          `Camera error: ${
            message ||
            "Unable to access the camera."
          }`
        );
      }
    }
  };

  /*
  ============================================================
  MANUAL / USB BARCODE SCANNER
  ============================================================
  */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !barcode.trim() ||
      loading ||
      cameraActive ||
      cameraStarting
    ) {
      return;
    }

    await processBarcode(
      barcode
    );

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  /*
  ============================================================
  UI
  ============================================================
  */

  return (
    <div className="w-full">

      {/* =====================================================
          CAMERA CONTAINER
      ====================================================== */}

      {(cameraActive ||
        cameraStarting) && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-green-200 bg-slate-950">

          {/* Header */}

          <div className="flex items-center justify-between px-4 py-3 text-white">

            <div>
              <p className="font-semibold">
                Camera Scanner
              </p>

              <p className="text-xs text-slate-300">
                {cameraStarting
                  ? "Starting camera..."
                  : "Point the barcode toward the camera"}
              </p>
            </div>

            <span className="flex items-center gap-2 text-xs text-green-400">

              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />

              {cameraStarting
                ? "Starting"
                : "Scanning"}

            </span>

          </div>

          {/*

            IMPORTANT:

            html5-qrcode owns this element.

            Do not place React children inside it.

          */}

          <div
            id={SCANNER_ID}
            className="min-h-[240px] w-full overflow-hidden"
          />

          {/* Instructions */}

          <p className="px-4 py-2 text-center text-xs text-slate-400">
            {cameraStarting
              ? "Please wait..."
              : "Keep the barcode inside the scanning area."}
          </p>

          {/* Stop button */}

          {!cameraStarting && (
            <button
              type="button"
              onClick={stopCamera}
              className="m-4 w-[calc(100%-2rem)] rounded-xl bg-white px-4 py-3.5 min-h-12 font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Stop Camera
            </button>
          )}

        </div>
      )}

      {/* =====================================================
          CONTROLS
      ====================================================== */}

      <div className="flex flex-col gap-3 sm:flex-row">

        {/* Camera button */}

        {!cameraActive &&
          !cameraStarting && (
            <button
              type="button"
              onClick={startCamera}
              disabled={loading}
              className="rounded-xl border border-green-600 bg-white px-5 py-3.5 min-h-12 font-semibold text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              📷 Scan with Camera
            </button>
          )}

        {/* Manual / physical scanner */}

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 gap-3"
        >

          <input
            ref={inputRef}
            type="text"
            value={barcode}
            onChange={(e) =>
              setBarcode(
                e.target.value
              )
            }
            placeholder="Scan or enter barcode"
            autoComplete="off"
            disabled={
              loading ||
              cameraActive ||
              cameraStarting
            }
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:bg-slate-100"
          />

          <button
            type="submit"
            disabled={
              loading ||
              cameraActive ||
              cameraStarting ||
              !barcode.trim()
            }
            className="rounded-xl bg-green-600 px-5 py-3.5 min-h-12 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Searching..."
              : "Find Product"}
          </button>

        </form>

      </div>

      {/* =====================================================
          DETECTED BARCODE
      ====================================================== */}

      {detectedBarcode && (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">

          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
            Detected Barcode
          </p>

          <p className="mt-1 break-all font-mono text-lg font-bold text-blue-900">
            {detectedBarcode}
          </p>

        </div>
      )}

      {/* =====================================================
          LOADING
      ====================================================== */}

      {loading && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          🔎 Searching for product...
        </div>
      )}

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <p className="font-semibold">
            Product Lookup Failed
          </p>

          <p className="mt-1">
            {error}
          </p>

        </div>
      )}

      {/* =====================================================
          HELP
      ====================================================== */}

      <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">

        <p className="text-sm font-medium text-slate-700">
          How to scan
        </p>

        <ul className="mt-2 space-y-1 text-xs text-slate-500">

          <li>
            📷 Use your camera to scan a barcode.
          </li>

          <li>
            💡 Make sure camera permission is enabled.
          </li>

          <li>
            🎯 Keep the barcode inside the scanning area.
          </li>

          <li>
            🔌 USB/Bluetooth barcode scanners are supported.
          </li>

          <li>
            ⌨️ You can also enter the barcode manually.
          </li>

        </ul>

      </div>

    </div>
  );
};

export default Scanner;