import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

import {
  createPayment,
  verifyPayment,
} from "../services/paymentService";

import { getOrderById } from "../services/orderService";
import { useCart } from "../context/CartContext";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { clearCart } = useCart();

  // --------------------------------------------------
  // ORDER / PAYMENT STATE
  // --------------------------------------------------

  const [order, setOrder] = useState(
    location.state?.order || null
  );

  const [payment, setPayment] = useState(
    location.state?.payment || null
  );

  const [loadingOrder, setLoadingOrder] = useState(
    !location.state?.order
  );

  const [loading, setLoading] = useState(false);
  const [paymentCreated, setPaymentCreated] = useState(
    Boolean(location.state?.payment)
  );

  const [error, setError] = useState("");

  // --------------------------------------------------
  // RECOVER ORDER AFTER PAGE REFRESH
  // --------------------------------------------------

  useEffect(() => {
    const recoverOrder = async () => {
      // Order already exists in React Router state.
      if (location.state?.order) {
        setLoadingOrder(false);
        return;
      }

      const savedOrderId =
        sessionStorage.getItem("smartcart_order_id");

      if (!savedOrderId) {
        setLoadingOrder(false);
        return;
      }

      try {
        setLoadingOrder(true);
        setError("");

        const data = await getOrderById(savedOrderId);

        if (!data?.order) {
          throw new Error("Order could not be recovered.");
        }

        setOrder(data.order);
      } catch (err) {
        console.error("Order recovery error:", err);

        setError(
          err.message ||
            "Unable to recover your order. Please try again."
        );
      } finally {
        setLoadingOrder(false);
      }
    };

    recoverOrder();
  }, [location.state]);

  // --------------------------------------------------
  // RECOVER PAYMENT AFTER PAGE REFRESH
  // --------------------------------------------------

  useEffect(() => {
    if (location.state?.payment) {
      return;
    }

    const savedPayment =
      sessionStorage.getItem("smartcart_payment");

    if (!savedPayment) {
      return;
    }

    try {
      const parsedPayment = JSON.parse(savedPayment);

      if (parsedPayment?.id) {
        setPayment(parsedPayment);
        setPaymentCreated(true);
      }
    } catch (err) {
      console.error(
        "Saved payment recovery error:",
        err
      );

      sessionStorage.removeItem("smartcart_payment");
    }
  }, [location.state]);

  // --------------------------------------------------
  // LOADING SCREEN
  // --------------------------------------------------

  if (loadingOrder) {
    return (
      <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
            🔄
          </div>

          <h2 className="mt-5 text-2xl font-bold text-slate-900">
            Recovering Your Order
          </h2>

          <p className="mt-2 text-slate-500">
            Please wait while we restore your payment session.
          </p>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // NO ORDER FOUND
  // --------------------------------------------------

  if (!order) {
    return (
      <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="text-5xl">⚠️</div>

          <h2 className="mt-5 text-2xl font-bold text-slate-900">
            No Order Found
          </h2>

          <p className="mt-2 text-slate-500">
            We couldn't find an active order for this payment.
          </p>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={() => navigate("/")}
            className="mt-6 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
          >
            Back to Shopping
          </button>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // PAYMENT DETAILS
  // --------------------------------------------------

  const amount = Number(order.total);

  // Temporary development UPI ID.
  // Replace this later with the real merchant UPI ID.
  const merchantUpiId = "smartcart@upi";
  const merchantName = "SmartCart";

  const upiUrl =
    `upi://pay?pa=${encodeURIComponent(merchantUpiId)}` +
    `&pn=${encodeURIComponent(merchantName)}` +
    `&am=${amount.toFixed(2)}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent(
      `SmartCart Order ${order.orderNumber}`
    )}`;

  // --------------------------------------------------
  // START PAYMENT
  // --------------------------------------------------

  const handleStartPayment = async () => {
    try {
      setLoading(true);
      setError("");

      const paymentData = await createPayment(
        order.id,
        "UPI"
      );

      const createdPayment = paymentData.payment;

      setPayment(createdPayment);
      setPaymentCreated(true);

      // Save payment so it survives browser refresh.
      sessionStorage.setItem(
        "smartcart_payment",
        JSON.stringify(createdPayment)
      );

      // Also make sure order ID remains available.
      sessionStorage.setItem(
        "smartcart_order_id",
        String(order.id)
      );
    } catch (err) {
      console.error("Payment creation error:", err);

      setError(
        err.message || "Unable to start payment."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // VERIFY PAYMENT
  // --------------------------------------------------

  const handleVerifyPayment = async () => {
    if (!payment?.id) {
      setError("Payment session not found.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const verificationData = await verifyPayment(
        payment.id
      );

      // Save verified payment before navigation.
      // This allows the receipt to recover after refresh.
      sessionStorage.setItem(
        "smartcart_payment",
        JSON.stringify(verificationData.payment)
      );

      sessionStorage.setItem(
        "smartcart_order_id",
        String(verificationData.order.id)
      );

      // Clear shopping cart after successful payment.
      clearCart();

      navigate("/success", {
        state: {
          order: verificationData.order,
          payment: verificationData.payment,
        },
      });
    } catch (err) {
      console.error(
        "Payment verification error:",
        err
      );

      setError(
        err.message ||
          "Payment could not be verified."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/checkout")}
            className="mb-5 text-sm font-medium text-slate-500 transition hover:text-green-600"
          >
            ← Back to Checkout
          </button>

          <p className="text-sm font-semibold uppercase tracking-wider text-green-600">
            Secure Checkout
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Complete Your Payment
          </h1>

          <p className="mt-2 text-slate-500">
            Scan the QR code and complete your UPI payment.
          </p>
        </div>

        {/* MAIN GRID */}
        <div className="grid gap-8 lg:grid-cols-3">

          {/* PAYMENT SECTION */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

              <h2 className="text-xl font-bold text-slate-900">
                UPI Payment
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Pay using Google Pay, PhonePe, Paytm or another
                UPI application.
              </p>

              {/* QR SECTION */}
              <div className="mt-6 rounded-2xl border-2 border-green-500 bg-green-50 p-6">
                <div className="flex flex-col items-center">

                  {/* STEP */}
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 font-bold text-white">
                      1
                    </div>

                    <span className="font-semibold text-slate-800">
                      Scan & Pay
                    </span>
                  </div>

                  {/* QR */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <QRCodeSVG
                      value={upiUrl}
                      size={240}
                      level="M"
                      includeMargin={true}
                    />
                  </div>

                  <p className="mt-5 text-lg font-bold text-slate-900">
                    Scan to Pay
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Amount Payable
                  </p>

                  <p className="mt-1 text-3xl font-bold text-green-600">
                    ₹{amount.toFixed(2)}
                  </p>

                  {/* UPI ID */}
                  <div className="mt-5 rounded-xl bg-white px-5 py-3 text-center shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      UPI ID
                    </p>

                    <p className="mt-1 font-semibold text-slate-700">
                      {merchantUpiId}
                    </p>
                  </div>
                </div>
              </div>

              {/* PAYMENT STATUS */}
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start gap-4">

                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      paymentCreated
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {paymentCreated ? "✓" : "2"}
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {paymentCreated
                        ? "Payment session created"
                        : "Start payment"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {paymentCreated
                        ? "Complete the payment using your UPI app, then confirm below."
                        : "Click the button below to start the payment session."}
                    </p>
                  </div>
                </div>
              </div>

              {/* DEVELOPMENT NOTICE */}
              <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                <strong>Development mode:</strong>{" "}
                UPI payment verification is currently simulated.
                Real payment gateway verification will be connected
                later.
              </div>

              {/* ERROR */}
              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* ACTION BUTTON */}
              {!paymentCreated ? (
                <button
                  onClick={handleStartPayment}
                  disabled={loading}
                  className="mt-6 w-full rounded-xl bg-green-600 px-5 py-4 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Starting Payment..."
                    : `Start Payment ₹${amount.toFixed(2)}`}
                </button>
              ) : (
                <button
                  onClick={handleVerifyPayment}
                  disabled={loading}
                  className="mt-6 w-full rounded-xl bg-green-600 px-5 py-4 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Verifying Payment..."
                    : "✓ I've Completed Payment"}
                </button>
              )}

              {/* PAYMENT NOTE */}
              {paymentCreated && (
                <p className="mt-3 text-center text-xs text-slate-400">
                  Only continue after completing the payment in
                  your UPI app.
                </p>
              )}
            </div>
          </div>

          {/* ORDER SUMMARY */}
          <div>
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold text-slate-900">
                Order Summary
              </h2>

              <div className="mt-6">

                {/* ORDER NUMBER */}
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Order</span>

                  <span className="font-medium text-slate-700">
                    #{order.orderNumber}
                  </span>
                </div>

                {/* SUBTOTAL */}
                <div className="mt-4 flex justify-between text-sm text-slate-500">
                  <span>Subtotal</span>

                  <span>
                    ₹{Number(order.subtotal).toFixed(2)}
                  </span>
                </div>

                {/* DISCOUNT */}
                <div className="mt-3 flex justify-between text-sm text-slate-500">
                  <span>Discount</span>

                  <span>
                    ₹{Number(order.discount).toFixed(2)}
                  </span>
                </div>

                {/* TAX */}
                <div className="mt-3 flex justify-between text-sm text-slate-500">
                  <span>Tax</span>

                  <span>
                    ₹{Number(order.tax).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="my-6 border-t border-slate-200" />

              {/* TOTAL */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">
                  Amount Payable
                </span>

                <span className="text-2xl font-bold text-green-600">
                  ₹{amount.toFixed(2)}
                </span>
              </div>

              {/* SECURITY INFO */}
              <div className="mt-6 rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-3">

                  <span className="text-xl">
                    🔒
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Secure Payment
                    </p>

                    <p className="text-xs text-slate-500">
                      Your order amount is verified by SmartCart.
                    </p>
                  </div>

                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </main>
  );
};

export default PaymentPage;