import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  CheckCircle2,
  QrCode,
  CreditCard,
  Banknote,
  ShieldCheck,
  AlertCircle,
  Loader2
} from "lucide-react";

import { createPayment, verifyPayment } from "../services/paymentService";
import { getOrderById } from "../services/orderService";
import { useCart } from "../context/CartContext";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const [order, setOrder] = useState(location.state?.order || null);
  const [payment, setPayment] = useState(location.state?.payment || null);
  const [loadingOrder, setLoadingOrder] = useState(!location.state?.order);

  const [selectedMethod, setSelectedMethod] = useState("UPI"); // "UPI" | "CARD" | "CASH"
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  // Recover order if page is refreshed
  useEffect(() => {
    const recoverOrder = async () => {
      if (location.state?.order) {
        setLoadingOrder(false);
        return;
      }

      const savedOrderId = sessionStorage.getItem("smartcart_order_id");
      if (!savedOrderId) {
        setLoadingOrder(false);
        return;
      }

      try {
        setLoadingOrder(true);
        setError("");
        const data = await getOrderById(savedOrderId);
        if (data?.order) {
          setOrder(data.order);
        }
      } catch (err) {
        console.error("Order recovery error:", err);
        setError("Unable to restore order session.");
      } finally {
        setLoadingOrder(false);
      }
    };

    recoverOrder();
  }, [location.state]);

  // Handle Payment Creation and Simulation
  const handleInitiateAndVerifyPayment = async () => {
    if (!order) return;

    try {
      setLoadingPayment(true);
      setError("");

      // 1. Create Payment Record on backend
      let currentPayment = payment;
      if (!currentPayment) {
        const createRes = await createPayment(order.id, selectedMethod);
        if (!createRes?.payment) {
          throw new Error("Failed to initialize payment session.");
        }
        currentPayment = createRes.payment;
        setPayment(currentPayment);
        sessionStorage.setItem("smartcart_payment", JSON.stringify(currentPayment));
      }

      // 2. Verify Payment on backend (simulates gateway response & deducts inventory)
      setVerifying(true);
      const verifyRes = await verifyPayment(currentPayment.id);

      if (!verifyRes?.success) {
        throw new Error(verifyRes?.message || "Payment verification failed.");
      }

      // 3. Clear cart and proceed to success digital receipt
      clearCart();

      navigate("/success", {
        state: {
          order: verifyRes.order || order,
          payment: verifyRes.payment || currentPayment,
        },
      });
    } catch (err) {
      console.error("Payment execution error:", err);
      setError(err?.message || "Payment could not be completed.");
    } finally {
      setLoadingPayment(false);
      setVerifying(false);
    }
  };

  if (loadingOrder) {
    return (
      <main className="min-h-[calc(100dvh-58px)] bg-slate-50 px-4 py-12 flex items-center justify-center">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
          <h2 className="mt-4 text-base font-bold text-slate-900">Restoring Payment Session</h2>
          <p className="mt-1 text-xs text-slate-500">Please wait a moment...</p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-[calc(100dvh-58px)] bg-slate-50 px-4 py-12 flex items-center justify-center">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
          <h2 className="mt-3 text-base font-bold text-slate-900">No Active Order Found</h2>
          <p className="mt-1 text-xs text-slate-500">Please start a new scan session.</p>
          <button
            onClick={() => navigate("/")}
            className="mt-5 w-full rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white"
          >
            Back to Scanner
          </button>
        </div>
      </main>
    );
  }

  const upiPayload = `upi://pay?pa=smartcart@merchant&pn=SmartCartExpress&am=${Number(
    order.total
  ).toFixed(2)}&tr=${order.order_number || order.orderNumber}&cu=INR`;

  return (
    <main className="min-h-[calc(100dvh-58px)] bg-slate-50 px-4 py-5 pb-32 sm:px-6 sm:py-8 lg:pb-12">
      <div className="mx-auto max-w-xl space-y-5">
        {/* Navigation Back */}
        <button
          onClick={() => navigate("/checkout")}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Order Review</span>
        </button>

        {/* Amount Hero Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Order Total · Express Self-Checkout
          </span>
          <h1 className="mt-1 text-4xl font-extrabold text-slate-900 tabular-nums">
            ₹{Number(order.total).toFixed(2)}
          </h1>
          <p className="mt-1 text-xs font-mono text-slate-500">
            Order ID: {order.order_number || order.orderNumber || `SC-${order.id}`}
          </p>
        </div>

        {/* Payment Methods Selector (Mobile Friendly Tabs) */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Select Payment Method</h2>

          <div className="grid grid-cols-3 gap-2">
            {/* UPI Option */}
            <button
              type="button"
              onClick={() => setSelectedMethod("UPI")}
              className={`flex flex-col items-center justify-center rounded-2xl p-3 min-h-[72px] border transition active:scale-95 ${
                selectedMethod === "UPI"
                  ? "border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <QrCode className="h-5 w-5 mb-1 text-emerald-600" />
              <span className="text-xs">UPI / QR</span>
            </button>

            {/* Card Option */}
            <button
              type="button"
              onClick={() => setSelectedMethod("CARD")}
              className={`flex flex-col items-center justify-center rounded-2xl p-3 min-h-[72px] border transition active:scale-95 ${
                selectedMethod === "CARD"
                  ? "border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <CreditCard className="h-5 w-5 mb-1 text-emerald-600" />
              <span className="text-xs">Debit / Card</span>
            </button>

            {/* Cash Option */}
            <button
              type="button"
              onClick={() => setSelectedMethod("CASH")}
              className={`flex flex-col items-center justify-center rounded-2xl p-3 min-h-[72px] border transition active:scale-95 ${
                selectedMethod === "CASH"
                  ? "border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Banknote className="h-5 w-5 mb-1 text-emerald-600" />
              <span className="text-xs">Cash Desk</span>
            </button>
          </div>

          {/* Payment Method Details Panel */}
          {selectedMethod === "UPI" && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5 text-center space-y-3">
              <p className="text-xs font-semibold text-slate-700">
                Scan with any UPI App (GPay / PhonePe / Paytm / BHIM)
              </p>

              {/* Dynamic QR Code */}
              <div className="mx-auto inline-block rounded-2xl bg-white p-3.5 shadow-sm border border-slate-200">
                <QRCodeSVG value={upiPayload} size={160} level="M" />
              </div>

              <p className="text-[11px] text-slate-400">
                Live terminal merchant: <span className="font-mono text-slate-600">smartcart@merchant</span>
              </p>
            </div>
          )}

          {selectedMethod === "CARD" && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-700">Card Payment Simulator</p>
              <div className="space-y-2">
                <input
                  type="text"
                  disabled
                  value="•••• •••• •••• 4242 (Visa Test)"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 font-mono"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    disabled
                    value="12/28"
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 font-mono"
                  />
                  <input
                    type="text"
                    disabled
                    value="CVV: •••"
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedMethod === "CASH" && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-center">
              <p className="text-xs font-semibold text-slate-700">Cash Payment at Exit Counter</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Show your order token at the cash assistance desk to pay cash and activate your exit pass.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Instant Complete Payment Button */}
          <button
            onClick={handleInitiateAndVerifyPayment}
            disabled={loadingPayment || verifying}
            className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-md shadow-emerald-700/20 active:scale-98 transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {loadingPayment || verifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verifying Payment & Deducting Stock...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm & Pay ₹{Number(order.total).toFixed(2)}</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Instant stock deduction & exit gate receipt generation</span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PaymentPage;