import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

import {
  createPayment,
  verifyPayment,
} from "../services/paymentService";

import { getOrderById } from "../services/orderService";
import { useCart } from "../context/CartContext";

const MERCHANT_UPI_ID = "smartcart@upi";
const MERCHANT_NAME = "SmartCart";

const formatPrice = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const Icon = ({ name, className = "h-5 w-5" }) => {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  const paths = {
    bag: (
      <>
        <path d="M5 8h14l1 12H4L5 8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    arrow: <path d="M19 12H5m7-7-7 7 7 7" />,
    refresh: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M4 17v-5h5" />
        <path d="M5.5 9a7 7 0 0 1 11.6-2L20 12M4 12l2.9 5a7 7 0 0 0 11.6-2" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 1 1 8 0v3" />
      </>
    ),
    receipt: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
    phone: (
      <>
        <rect x="6" y="2" width="12" height="20" rx="2" />
        <path d="M10 18h4" />
      </>
    ),
  };

  return <svg {...common}>{paths[name] || paths.check}</svg>;
};

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const [order, setOrder] = useState(location.state?.order || null);
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
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);

  // Restore the order if the page is refreshed.
  useEffect(() => {
    let cancelled = false;

    const recoverOrder = async () => {
      if (location.state?.order) {
        setOrder(location.state.order);
        setLoadingOrder(false);
        return;
      }

      const savedOrderId = sessionStorage.getItem(
        "smartcart_order_id"
      );

      if (!savedOrderId) {
        setLoadingOrder(false);
        return;
      }

      try {
        setLoadingOrder(true);
        setError("");

        const data = await getOrderById(savedOrderId);

        if (!data?.order) {
          throw new Error("Your order could not be recovered.");
        }

        if (!cancelled) {
          setOrder(data.order);
        }
      } catch (err) {
        console.error("Order recovery error:", err);

        if (!cancelled) {
          setError(
            err.message ||
              "Unable to restore your order. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingOrder(false);
        }
      }
    };

    recoverOrder();

    return () => {
      cancelled = true;
    };
  }, [location.state]);

  // Restore the saved payment session.
  useEffect(() => {
    if (location.state?.payment) {
      setPayment(location.state.payment);
      setPaymentCreated(true);
      return;
    }

    const savedPayment = sessionStorage.getItem(
      "smartcart_payment"
    );

    if (!savedPayment) return;

    try {
      const parsedPayment = JSON.parse(savedPayment);

      if (parsedPayment?.id) {
        setPayment(parsedPayment);
        setPaymentCreated(true);
      }
    } catch (err) {
      console.error("Saved payment recovery error:", err);
      sessionStorage.removeItem("smartcart_payment");
    }
  }, [location.state]);

  const copyText = async (value, message) => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setNotice(message);

      window.setTimeout(() => {
        setCopied(false);
        setNotice("");
      }, 2500);
    } catch {
      setError(
        "Unable to copy automatically. Please select and copy the text."
      );
    }
  };

  // Create a payment session.
  const handleStartPayment = async () => {
    if (!order?.id) {
      setError("Order details are missing. Please recover your order.");
      return;
    }

    if (!Number.isFinite(Number(order.total)) || Number(order.total) <= 0) {
      setError("The order amount is invalid. Please return to checkout.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setNotice("");

      const paymentData = await createPayment(order.id, "UPI");
      const createdPayment = paymentData?.payment;

      if (!createdPayment?.id) {
        throw new Error(
          "The payment service did not return a valid payment session."
        );
      }

      setPayment(createdPayment);
      setPaymentCreated(true);

      sessionStorage.setItem(
        "smartcart_payment",
        JSON.stringify(createdPayment)
      );

      sessionStorage.setItem(
        "smartcart_order_id",
        String(order.id)
      );
    } catch (err) {
      console.error("Payment creation error:", err);
      setError(
        err.message || "Unable to start payment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Ask the backend to verify payment.
  const handleVerifyPayment = async () => {
    if (!payment?.id) {
      setError("Payment session not found. Please start payment again.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setNotice("");

      const verificationData = await verifyPayment(payment.id);

      if (!verificationData?.payment || !verificationData?.order) {
        throw new Error(
          "The server returned an incomplete verification response."
        );
      }

      const paymentStatus = String(
        verificationData.payment.status || ""
      ).toLowerCase();

      const orderStatus = String(
        verificationData.order.paymentStatus ||
          verificationData.order.payment_status ||
          ""
      ).toLowerCase();

      const isPaid =
        [
          "paid",
          "completed",
          "success",
          "successful",
          "verified",
        ].includes(paymentStatus) ||
        [
          "paid",
          "completed",
          "success",
          "successful",
        ].includes(orderStatus);

      if (!isPaid) {
        setPayment(verificationData.payment);

        sessionStorage.setItem(
          "smartcart_payment",
          JSON.stringify(verificationData.payment)
        );

        setNotice(
          "Payment has not been confirmed yet. If you have paid, wait briefly and check again."
        );
        return;
      }

      sessionStorage.setItem(
        "smartcart_payment",
        JSON.stringify(verificationData.payment)
      );

      sessionStorage.setItem(
        "smartcart_order_id",
        String(verificationData.order.id)
      );

      clearCart();

      navigate("/success", {
        state: {
          order: verificationData.order,
          payment: verificationData.payment,
        },
      });
    } catch (err) {
      console.error("Payment verification error:", err);
      setError(
        err.message ||
          "Payment could not be verified. Please retry verification."
      );
    } finally {
      setLoading(false);
    }
  };

  // Loading state.
  if (loadingOrder) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#F5F8F6] px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-[#E2E9E4] bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-[#EAF3ED] text-[#153D30]">
            <Icon name="refresh" className="h-7 w-7" />
          </div>

          <h2 className="mt-5 text-xl font-bold text-[#17231F]">
            Restoring your order
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#718078]">
            Please wait while SmartCart retrieves your checkout session.
          </p>
        </div>
      </main>
    );
  }

  // No order state.
  if (!order) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#F5F8F6] px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-[#E2E9E4] bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Icon name="receipt" className="h-8 w-8" />
          </div>

          <h2 className="mt-5 text-2xl font-bold text-[#17231F]">
            No active order found
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#718078]">
            We couldn't find an order to pay for. Return to checkout to
            start a new order.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-left text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate("/checkout")}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#153D30] px-5 py-3.5 font-semibold text-white transition hover:bg-[#205541] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D30] focus-visible:ring-offset-2"
          >
            <Icon name="arrow" />
            Return to checkout
          </button>
        </div>
      </main>
    );
  }

  const amount = Number(order.total ?? 0);

  const upiUrl =
    `upi://pay?pa=${encodeURIComponent(MERCHANT_UPI_ID)}` +
    `&pn=${encodeURIComponent(MERCHANT_NAME)}` +
    `&am=${amount.toFixed(2)}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent(
      `SmartCart Order ${order.orderNumber || order.id}`
    )}`;

  const steps = [
    { number: "01", label: "Order review", complete: true },
    { number: "02", label: "Scan & pay", complete: paymentCreated },
    { number: "03", label: "Confirmation", complete: false },
  ];

  return (
    <main className="min-h-[calc(100vh-73px)] bg-[#F5F8F6] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate("/checkout")}
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#718078] transition hover:text-[#153D30]"
          >
            <Icon name="arrow" className="h-4 w-4" />
            Back to checkout
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#DCE8DF] bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#205541]">
                <Icon name="lock" className="h-3.5 w-3.5" />
                SmartCart payment
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-[#17231F] sm:text-4xl">
                Complete your payment
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#718078] sm:text-base">
                Scan the QR code with your UPI app and verify your payment
                to finish checkout.
              </p>
            </div>

            <div className="rounded-2xl border border-[#DCE8DF] bg-white px-4 py-3 sm:min-w-44">
              <p className="text-xs font-medium uppercase tracking-wide text-[#718078]">
                Amount payable
              </p>
              <p className="mt-1 text-2xl font-bold text-[#153D30]">
                {formatPrice(amount)}
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-7 rounded-2xl border border-[#E2E9E4] bg-white p-4 sm:p-5">
          <div className="grid grid-cols-3 gap-2 sm:gap-5">
            {steps.map((step, index) => {
              const active = index < 2;

              return (
                <div key={step.number} className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        step.complete
                          ? "bg-[#153D30] text-white"
                          : active
                          ? "border-2 border-[#153D30] bg-[#EAF3ED] text-[#153D30]"
                          : "bg-[#EEF1EF] text-[#89968E]"
                      }`}
                    >
                      {step.complete ? (
                        <Icon name="check" className="h-4 w-4" />
                      ) : (
                        step.number
                      )}
                    </div>

                    <span
                      className={`truncate text-xs font-semibold sm:text-sm ${
                        step.complete || active
                          ? "text-[#17231F]"
                          : "text-[#89968E]"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>

                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#EDF1EE]">
                    <div
                      className={`h-full rounded-full transition-all ${
                        step.complete
                          ? "w-full bg-[#15803D]"
                          : index === 1 && paymentCreated
                          ? "w-1/2 bg-[#15803D]"
                          : "w-0"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_350px]">
          {/* Payment panel */}
          <section className="min-w-0 overflow-hidden rounded-3xl border border-[#E2E9E4] bg-white shadow-sm">
            <div className="border-b border-[#E2E9E4] px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3ED] text-[#153D30]">
                  <Icon name="phone" className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#17231F]">
                    Pay with UPI
                  </h2>
                  <p className="mt-0.5 text-sm text-[#718078]">
                    Google Pay, PhonePe, Paytm and other UPI apps
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              {/* QR */}
              <div className="rounded-2xl border border-[#DCE8DF] bg-[#F7FAF7] p-5 sm:p-7">
                <div className="mx-auto max-w-sm text-center">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#53645A] shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-[#15803D]" />
                    UPI QR payment
                  </div>

                  <div className="mx-auto mt-5 w-fit rounded-2xl border border-[#E2E9E4] bg-white p-3 shadow-sm sm:p-4">
                    <QRCodeSVG
                      value={upiUrl}
                      size={220}
                      level="M"
                      includeMargin
                      bgColor="#FFFFFF"
                      fgColor="#153D30"
                      title="SmartCart UPI payment QR code"
                      style={{
                        display: "block",
                        width: "min(220px, 60vw)",
                        height: "auto",
                      }}
                    />
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-[#17231F]">
                    Scan to pay
                  </h3>

                  <p className="mt-1 text-sm text-[#718078]">
                    Open your UPI app and scan this code.
                  </p>

                  <div className="mt-5 rounded-2xl border border-[#E2E9E4] bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-[#89968E]">
                      Exact amount
                    </p>
                    <p className="mt-1 text-3xl font-bold tracking-tight text-[#153D30]">
                      {formatPrice(amount)}
                    </p>
                    <p className="mt-1 text-xs text-[#718078]">
                      INR · Order #{order.orderNumber || order.id}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#718078]">
                    <Icon name="lock" className="h-4 w-4" />
                    Check the recipient and amount before paying.
                  </div>
                </div>
              </div>

              {/* UPI details */}
              <div className="mt-5 rounded-2xl border border-[#E2E9E4] p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-[#89968E]">
                      Payee
                    </p>
                    <p className="mt-1 font-semibold text-[#17231F]">
                      {MERCHANT_NAME}
                    </p>
                    <p className="mt-1 break-all text-sm text-[#718078]">
                      {MERCHANT_UPI_ID}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      copyText(MERCHANT_UPI_ID, "UPI ID copied.")
                    }
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#DCE5DE] bg-white px-4 py-2.5 text-sm font-semibold text-[#153D30] transition hover:bg-[#F5F8F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D30]"
                  >
                    <Icon
                      name={copied ? "check" : "copy"}
                      className="h-4 w-4"
                    />
                    {copied ? "Copied" : "Copy UPI ID"}
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-6">
                <h3 className="font-bold text-[#17231F]">
                  How to complete payment
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {[
                    {
                      number: "1",
                      title: "Open UPI app",
                      description:
                        "Open your preferred UPI application on your phone.",
                    },
                    {
                      number: "2",
                      title: "Scan and pay",
                      description:
                        "Scan the QR code and confirm the displayed amount.",
                    },
                    {
                      number: "3",
                      title: "Verify payment",
                      description:
                        "Return here and check your payment status.",
                    },
                  ].map((step) => (
                    <div
                      key={step.number}
                      className="rounded-xl bg-[#F5F8F6] p-4"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-[#153D30] shadow-sm">
                        {step.number}
                      </span>
                      <h4 className="mt-3 text-sm font-semibold text-[#17231F]">
                        {step.title}
                      </h4>
                      <p className="mt-1 text-xs leading-5 text-[#718078]">
                        {step.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback */}
              {error && (
                <div
                  role="alert"
                  className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  <span className="font-bold">!</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">Something went wrong</p>
                    <p className="mt-1 break-words leading-5">{error}</p>
                    <button
                      type="button"
                      onClick={() => setError("")}
                      className="mt-2 font-semibold underline underline-offset-2"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {notice && (
                <div
                  role="status"
                  className="mt-5 rounded-xl border border-[#DCE8DF] bg-[#F0F7F1] p-4 text-sm leading-5 text-[#205541]"
                >
                  {notice}
                </div>
              )}

              {/* Development notice */}
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <Icon
                    name="clock"
                    className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
                  />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      Payment integration notice
                    </p>
                    <p className="mt-1 text-xs leading-5 text-amber-800">
                      This project currently uses a development UPI
                      configuration. Replace it with a valid merchant
                      UPI ID and ensure the backend verifies real
                      payment status before confirming an order.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment actions */}
              <div className="mt-6 grid gap-3">
                {!paymentCreated ? (
                  <button
                    type="button"
                    onClick={handleStartPayment}
                    disabled={loading || amount <= 0}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#153D30] px-5 py-4 font-semibold text-white transition hover:bg-[#205541] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D30] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Creating payment session...
                      </>
                    ) : (
                      <>
                        Start payment · {formatPrice(amount)}
                        <span aria-hidden="true">→</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleVerifyPayment}
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#153D30] px-5 py-4 font-semibold text-white transition hover:bg-[#205541] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D30] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Checking payment status...
                      </>
                    ) : (
                      <>
                        <Icon name="refresh" className="h-5 w-5" />
                        Verify payment
                      </>
                    )}
                  </button>
                )}

                <p className="text-center text-xs leading-5 text-[#89968E]">
                  {paymentCreated
                    ? "If your payment is still processing, wait a moment before retrying."
                    : "A payment session will be created before you continue."}
                </p>
              </div>
            </div>
          </section>

          {/* Order summary */}
          <aside className="space-y-5 lg:sticky lg:top-24">
            <section className="rounded-3xl border border-[#E2E9E4] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3ED] text-[#153D30]">
                  <Icon name="receipt" />
                </div>
                <div>
                  <h2 className="font-bold text-[#17231F]">
                    Order summary
                  </h2>
                  <p className="text-xs text-[#718078]">
                    Review before paying
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-[#F5F8F6] p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-[#89968E]">
                  Order number
                </p>
                <p className="mt-1 break-all font-bold text-[#17231F]">
                  #{order.orderNumber || order.id}
                </p>
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-[#718078]">Subtotal</span>
                  <span className="font-medium text-[#17231F]">
                    {formatPrice(order.subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-[#718078]">Discount</span>
                  <span className="font-medium text-[#15803D]">
                    −{formatPrice(order.discount)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-[#718078]">Tax</span>
                  <span className="font-medium text-[#17231F]">
                    {formatPrice(order.tax)}
                  </span>
                </div>
              </div>

              <div className="my-5 border-t border-dashed border-[#DCE5DE]" />

              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#17231F]">
                    Total payable
                  </p>
                  <p className="mt-1 text-xs text-[#89968E]">
                    Including listed charges
                  </p>
                </div>
                <p className="text-2xl font-bold text-[#153D30]">
                  {formatPrice(amount)}
                </p>
              </div>

              <div className="mt-6 rounded-xl border border-[#DCE8DF] bg-[#F7FAF7] p-4">
                <div className="flex items-start gap-3">
                  <Icon
                    name="shield"
                    className="h-5 w-5 shrink-0 text-[#205541]"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#17231F]">
                      Payment safety
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#718078]">
                      Confirm the payee and amount in your UPI app.
                      Never share your UPI PIN or OTP with anyone.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <div className="rounded-2xl border border-[#E2E9E4] bg-white p-4">
              <div className="flex items-start gap-3">
                <Icon
                  name="clock"
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#718078]"
                />
                <div>
                  <p className="text-sm font-semibold text-[#17231F]">
                    Payment taking longer?
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#718078]">
                    Don't pay twice. Wait for your UPI app's result and
                    use Verify payment to check the status.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <footer className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-[#E2E9E4] py-5 text-center text-xs text-[#89968E] sm:flex-row sm:text-left">
          <p className="inline-flex items-center gap-2">
            <Icon name="bag" className="h-4 w-4" />
            SmartCart · Smart self-checkout
          </p>
          <p>
            Keep your payment confirmation until your order is complete.
          </p>
        </footer>
      </div>
    </main>
  );
};

export default PaymentPage;
