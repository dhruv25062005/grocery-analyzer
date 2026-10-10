import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getOrderById } from "../services/orderService";
import { useCart } from "../context/CartContext";

const formatPrice = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

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
    check: <path d="m5 12 4 4L19 6" />,
    receipt: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
    bag: (
      <>
        <path d="M5 8h14l1 12H4L5 8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
      </>
    ),
    printer: (
      <>
        <path d="M6 9V3h12v6" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <path d="M6 14h12v7H6z" />
        <path d="M18 12h.01" />
      </>
    ),
    arrow: <path d="M19 12H5m7-7-7 7 7 7" />,
    shield: (
      <>
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </>
    ),
    credit: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20M6 15h4" />
      </>
    ),
    shopping: (
      <>
        <circle cx="9" cy="20" r="1" />
        <circle cx="19" cy="20" r="1" />
        <path d="M2 3h2l3 12a2 2 0 0 0 2 1.5h9.5a2 2 0 0 0 2-1.5L22 8H5" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" />
        <path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z" />
      </>
    ),
  };

  return <svg {...common}>{paths[name] || paths.check}</svg>;
};

const SuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const [order, setOrder] = useState(location.state?.order || null);
  const [payment, setPayment] = useState(
    location.state?.payment || null
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Recover the complete order after a page refresh.
  useEffect(() => {
    let cancelled = false;

    const recoverOrder = async () => {
      setError("");

      const stateOrderId = location.state?.order?.id;
      const savedOrderId = sessionStorage.getItem(
        "smartcart_order_id"
      );

      const orderId = stateOrderId || savedOrderId;

      if (!orderId) {
        if (!cancelled) {
          setOrder(location.state?.order || null);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);

        const data = await getOrderById(orderId);

        if (!data?.order) {
          throw new Error("Order details could not be recovered.");
        }

        if (!cancelled) {
          setOrder(data.order);

          sessionStorage.setItem(
            "smartcart_order_id",
            String(data.order.id)
          );
        }
      } catch (err) {
        console.error("Receipt recovery error:", err);

        if (!cancelled) {
          // Retain navigation-state data if the API is temporarily down.
          if (location.state?.order) {
            setOrder(location.state.order);
          }

          setError(
            err.message ||
              "Unable to refresh order details. Showing available receipt data."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    recoverOrder();

    return () => {
      cancelled = true;
    };
  }, [location.state]);

  // Restore payment information from the current session.
  useEffect(() => {
    if (location.state?.payment) {
      setPayment(location.state.payment);

      sessionStorage.setItem(
        "smartcart_payment",
        JSON.stringify(location.state.payment)
      );

      return;
    }

    const savedPayment = sessionStorage.getItem(
      "smartcart_payment"
    );

    if (!savedPayment) return;

    try {
      const parsed = JSON.parse(savedPayment);

      if (parsed?.id) {
        setPayment(parsed);
      }
    } catch (err) {
      console.error("Payment recovery error:", err);
      sessionStorage.removeItem("smartcart_payment");
    }
  }, [location.state]);

  const orderNumber =
    order?.orderNumber ||
    order?.order_number ||
    order?.id ||
    "N/A";

  const orderTotal = Number(order?.total ?? 0);
  const subtotal = Number(order?.subtotal ?? 0);
  const discount = Number(order?.discount ?? 0);
  const tax = Number(order?.tax ?? 0);

  const items = Array.isArray(order?.items) ? order.items : [];

  const paymentReference =
    payment?.payment_reference ||
    payment?.paymentReference ||
    payment?.reference ||
    null;

  const paymentMethod = payment?.method || "UPI";

  const rawPaymentStatus = String(
    payment?.status ||
      order?.paymentStatus ||
      order?.payment_status ||
      ""
  ).toLowerCase();

  const isPaid = [
    "paid",
    "completed",
    "success",
    "successful",
    "verified",
  ].includes(rawPaymentStatus);

  const isPending = [
    "pending",
    "processing",
    "created",
    "initiated",
  ].includes(rawPaymentStatus);

  const paidAt =
    payment?.paid_at ||
    payment?.paidAt ||
    payment?.updated_at ||
    payment?.updatedAt ||
    null;

  const itemCount = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const handleCopyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(String(orderNumber));
      setCopied(true);

      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Unable to copy the order number. Please copy it manually.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewShopping = () => {
    clearCart();

    sessionStorage.removeItem("smartcart_order_id");
    sessionStorage.removeItem("smartcart_payment");

    navigate("/");
  };

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#F5F8F6] px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-[#E2E9E4] bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-[#EAF3ED] text-[#153D30]">
            <Icon name="receipt" className="h-7 w-7" />
          </div>

          <h2 className="mt-5 text-xl font-bold text-[#17231F]">
            Preparing your receipt
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#718078]">
            Please wait while SmartCart retrieves your order details.
          </p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#F5F8F6] px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-[#E2E9E4] bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Icon name="receipt" className="h-8 w-8" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-[#17231F]">
            Receipt not found
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#718078]">
            We couldn't retrieve your order. You can return to SmartCart
            and continue shopping.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#153D30] px-5 py-3.5 font-semibold text-white transition hover:bg-[#205541]"
          >
            <Icon name="shopping" />
            Return to SmartCart
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-73px)] bg-[#F5F8F6] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        {/* Success banner */}
        <section className="relative mb-8 overflow-hidden rounded-3xl bg-[#153D30] px-6 py-9 text-center text-white shadow-lg sm:px-10 sm:py-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -left-10 h-64 w-64 rounded-full border border-white/10"
          />

          <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/25">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full ${
                isPaid ? "bg-[#D9F99D] text-[#153D30]" : "bg-white/15 text-white"
              }`}
            >
              <Icon
                name={isPaid ? "check" : "receipt"}
                className="h-8 w-8"
              />
            </div>
          </div>

          <div className="relative mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider">
            <Icon name="sparkles" className="h-4 w-4" />
            SmartCart self-checkout
          </div>

          <h1 className="relative mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            {isPaid
              ? "Payment successful!"
              : isPending
              ? "Order received"
              : "Your order receipt"}
          </h1>

          <p className="relative mx-auto mt-3 max-w-lg text-sm leading-6 text-white/75 sm:text-base">
            {isPaid
              ? "Thank you for shopping with SmartCart. Your payment is marked as successful."
              : isPending
              ? "Your order details are available, but payment is not yet confirmed."
              : "Your order details are available below. Check the payment status before treating this order as paid."}
          </p>

          <div className="relative mx-auto mt-7 inline-block rounded-2xl border border-white/15 bg-white/10 px-6 py-4">
            <p className="text-xs font-medium uppercase tracking-widest text-white/65">
              {isPaid ? "Total paid" : "Order total"}
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums sm:text-4xl">
              {formatPrice(orderTotal)}
            </p>
          </div>
        </section>

        {/* Recovery message */}
        {error && (
          <div
            role="status"
            className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
          >
            {error}
          </div>
        )}

        {/* Order reference */}
        <section className="mb-6 rounded-2xl border border-[#E2E9E4] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF3ED] text-[#153D30]">
                <Icon name="receipt" className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[#89968E]">
                  Order reference
                </p>
                <p className="mt-1 break-all text-lg font-bold text-[#17231F]">
                  #{orderNumber}
                </p>
                <p className="mt-1 text-xs text-[#718078]">
                  {formatDate(order.created_at || order.createdAt)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyOrderNumber}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCE5DE] px-4 py-2.5 text-sm font-semibold text-[#153D30] transition hover:bg-[#F5F8F6]"
            >
              <Icon name={copied ? "check" : "copy"} className="h-4 w-4" />
              {copied ? "Copied" : "Copy order number"}
            </button>
          </div>
        </section>

        {/* Receipt card */}
        <section
          id="receipt"
          className="overflow-hidden rounded-3xl border border-[#E2E9E4] bg-white shadow-sm"
        >
          {/* Receipt heading */}
          <div className="border-b border-dashed border-[#DCE5DE] px-5 py-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#153D30] text-[#D9F99D]">
                  <Icon name="bag" className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#153D30]">
                    SmartCart
                  </h2>
                  <p className="text-sm text-[#718078]">
                    Digital purchase receipt
                  </p>
                </div>
              </div>

              <div
                className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${
                  isPaid
                    ? "bg-emerald-50 text-emerald-700"
                    : isPending
                    ? "bg-amber-50 text-amber-700"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isPaid
                      ? "bg-emerald-500"
                      : isPending
                      ? "bg-amber-500"
                      : "bg-slate-400"
                  }`}
                />
                {isPaid
                  ? "Payment confirmed"
                  : isPending
                  ? "Payment pending"
                  : rawPaymentStatus
                  ? rawPaymentStatus.replace(/_/g, " ")
                  : "Payment status unavailable"}
              </div>
            </div>
          </div>

          {/* Payment details */}
          <div className="grid gap-5 border-b border-dashed border-[#DCE5DE] px-5 py-6 sm:grid-cols-2 sm:px-8">
            <div className="flex items-start gap-3">
              <Icon name="credit" className="mt-0.5 h-5 w-5 text-[#718078]" />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-[#89968E]">
                  Payment method
                </p>
                <p className="mt-1 font-semibold text-[#17231F]">
                  {paymentMethod}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Icon name="calendar" className="mt-0.5 h-5 w-5 text-[#718078]" />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-[#89968E]">
                  Payment date
                </p>
                <p className="mt-1 font-semibold text-[#17231F]">
                  {formatDate(paidAt)}
                </p>
              </div>
            </div>

            <div className="sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wider text-[#89968E]">
                Payment reference
              </p>
              <p className="mt-1 break-all font-semibold text-[#17231F]">
                {paymentReference || "Not provided"}
              </p>
            </div>
          </div>

          {/* Purchased items */}
          <div className="px-5 py-6 sm:px-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#17231F]">
                  Purchased items
                </h3>
                <p className="mt-1 text-sm text-[#718078]">
                  Your itemized order breakdown
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-[#EAF3ED] px-3 py-1.5 text-xs font-semibold text-[#205541]">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            </div>

            {items.length > 0 ? (
              <div className="mt-5">
                {/* Column labels */}
                <div className="hidden grid-cols-[minmax(0,1fr)_auto_auto] gap-4 border-b border-[#E2E9E4] pb-3 text-xs font-semibold uppercase tracking-wider text-[#89968E] sm:grid">
                  <span>Product</span>
                  <span className="text-right">Quantity</span>
                  <span className="text-right">Amount</span>
                </div>

                <div className="divide-y divide-[#E2E9E4]">
                  {items.map((item, index) => {
                    const quantity = Number(item.quantity || 0);

                    const unitPrice = Number(
                      item.unit_price ??
                        item.unitPrice ??
                        item.price ??
                        0
                    );

                    const itemSubtotal = Number(
                      item.subtotal ??
                        item.total ??
                        unitPrice * quantity
                    );

                    return (
                      <div
                        key={item.id ?? `${item.name}-${index}`}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:gap-4"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F5F2] text-[#53645A]">
                            <Icon name="bag" className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <p className="break-words font-semibold text-[#17231F]">
                              {item.name || "Product"}
                            </p>

                            {item.brand && (
                              <p className="mt-1 text-xs text-[#718078]">
                                {item.brand}
                              </p>
                            )}

                            <p className="mt-1 text-xs text-[#89968E]">
                              {formatPrice(unitPrice)} per unit
                            </p>

                            <p className="mt-1 text-xs text-[#718078] sm:hidden">
                              Quantity: {quantity}
                            </p>
                          </div>
                        </div>

                        <span className="hidden text-right text-sm text-[#53645A] sm:block">
                          {quantity}
                        </span>

                        <strong className="text-right text-sm font-bold tabular-nums text-[#17231F] sm:text-base">
                          {formatPrice(itemSubtotal)}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl bg-[#F5F8F6] p-6 text-center">
                <Icon
                  name="receipt"
                  className="mx-auto h-8 w-8 text-[#89968E]"
                />
                <p className="mt-3 text-sm font-medium text-[#53645A]">
                  Individual item details aren't available.
                </p>
                <p className="mt-1 text-xs text-[#89968E]">
                  The order total below is from the saved order.
                </p>
              </div>
            )}
          </div>

          {/* Billing totals */}
          <div className="border-t border-[#E2E9E4] bg-[#F7FAF7] px-5 py-6 sm:px-8">
            <h3 className="mb-5 text-base font-bold text-[#17231F]">
              Billing summary
            </h3>

            <div className="ml-auto max-w-sm space-y-3">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-[#718078]">Subtotal</span>
                <span className="font-medium tabular-nums text-[#17231F]">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-sm">
                <span className="text-[#718078]">Discount</span>
                <span className="font-medium tabular-nums text-[#15803D]">
                  −{formatPrice(discount)}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-sm">
                <span className="text-[#718078]">Tax</span>
                <span className="font-medium tabular-nums text-[#17231F]">
                  {formatPrice(tax)}
                </span>
              </div>

              <div className="border-t border-dashed border-[#DCE5DE] pt-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-[#17231F]">
                      {isPaid ? "Total paid" : "Order total"}
                    </p>
                    <p className="mt-1 text-xs text-[#89968E]">
                      Amount recorded for this order
                    </p>
                  </div>

                  <p className="text-2xl font-bold tabular-nums text-[#153D30]">
                    {formatPrice(orderTotal)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Receipt footer */}
          <div className="border-t border-dashed border-[#DCE5DE] px-5 py-7 text-center sm:px-8">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF3ED] text-[#153D30]">
              <Icon name="shield" className="h-5 w-5" />
            </div>

            <p className="mt-3 font-semibold text-[#17231F]">
              Thank you for shopping with SmartCart
            </p>

            <p className="mt-1 text-sm leading-6 text-[#718078]">
              {isPaid
                ? "Your digital receipt is ready. Keep it for your records."
                : "Keep this order reference until your payment status is confirmed."}
            </p>
          </div>
        </section>

        {/* Actions */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCE5DE] bg-white px-5 py-4 font-semibold text-[#153D30] transition hover:bg-[#F1F5F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D30]"
          >
            <Icon name="printer" className="h-5 w-5" />
            Print / Save receipt
          </button>

          <button
            type="button"
            onClick={handleNewShopping}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#153D30] px-5 py-4 font-semibold text-white transition hover:bg-[#205541] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D30] focus-visible:ring-offset-2"
          >
            <Icon name="shopping" className="h-5 w-5" />
            Start new shopping
          </button>
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-[#89968E]">
          SmartCart · Smart self-checkout · Thank you for your purchase
        </p>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            size: auto;
            margin: 12mm;
          }

          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          nav,
          header,
          footer,
          button,
          [role="status"] {
            display: none !important;
          }

          main {
            min-height: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          #receipt {
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
            border: 1px solid #d1d5db !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          #receipt section,
          #receipt > div {
            break-inside: avoid;
          }

          #receipt .bg-\\[\\#153D30\\] {
            background: #153D30 !important;
            color: white !important;
          }
        }
      `}</style>
    </main>
  );
};

export default SuccessPage;
