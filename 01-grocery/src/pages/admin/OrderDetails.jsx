import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getOrderById } from "../../services/orderService";

const formatCurrency = (value) => {
  const amount = Number(value);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
};

const formatDate = (date) => {
  if (!date) return "N/A";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
};

const formatLabel = (value) => {
  if (!value) return "N/A";

  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const Icon = ({ name, className = "h-5 w-5" }) => {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  const paths = {
    back: (
      <>
        <path d="m15 18-6-6 6-6" />
        <path d="M9 12h12" />
      </>
    ),
    bag: (
      <>
        <path d="M5 8h14l1 13H4L5 8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
      </>
    ),
    print: (
      <>
        <path d="M7 8V3h10v5M7 17H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-3" />
        <path d="M7 14h10v7H7zM18 11h.01" />
      </>
    ),
    package: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 8 9 5 9-5M3 8v9l9 5 9-5V8M12 13v9" />
      </>
    ),
    card: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <path d="M2 10h20M7 15h3" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    alert: (
      <>
        <path d="M12 3 2.5 20h19L12 3Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M5.6 9a7 7 0 0 1 11.8-2L20 12M4 12l2.6 5a7 7 0 0 0 11.8-2" />
      </>
    ),
    receipt: (
      <>
        <path d="M5 3 7 5l2-2 3 2 3-2 2 2 2-2v18l-2-2-3 2-3-2-2 2-2-2-2 2V3Z" />
        <path d="M9 9h6M9 13h6M9 17h3" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  };

  return <svg {...common}>{paths[name] || paths.bag}</svg>;
};

const StatusBadge = ({ status, type = "order" }) => {
  const normalized = String(status || "unknown").toLowerCase();

  let colors =
    "border-slate-200 bg-slate-100 text-slate-600";

  if (
    ["paid", "completed", "success", "successful", "captured"].includes(
      normalized
    )
  ) {
    colors = "border-emerald-200 bg-emerald-50 text-emerald-700";
  } else if (
    ["pending", "processing", "initiated"].includes(normalized)
  ) {
    colors = "border-amber-200 bg-amber-50 text-amber-700";
  } else if (
    ["failed", "cancelled", "canceled", "refunded", "rejected"].includes(
      normalized
    )
  ) {
    colors = "border-rose-200 bg-rose-50 text-rose-700";
  }

  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${colors}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {formatLabel(normalized)}
      {type === "payment" && (
        <span className="sr-only"> payment status</span>
      )}
    </span>
  );
};

const SectionHeading = ({ icon, title, description, trailing }) => (
  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E2E9E4] px-5 py-5 sm:px-6">
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3ED] text-[#205541]">
        <Icon name={icon} />
      </span>

      <div>
        <h2 className="text-base font-bold text-[#17231F]">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-[#748078]">{description}</p>
        )}
      </div>
    </div>

    {trailing}
  </div>
);

const LoadingSkeleton = () => (
  <main className="min-h-screen bg-[#F5F8F6] px-4 py-6 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl animate-pulse space-y-6">
      <div className="h-5 w-36 rounded bg-slate-200" />

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="h-4 w-28 rounded bg-slate-200" />
        <div className="mt-4 h-8 w-56 max-w-full rounded bg-slate-200" />
        <div className="mt-3 h-4 w-64 max-w-full rounded bg-slate-100" />
        <div className="mt-6 h-10 w-28 rounded-full bg-slate-100" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="h-80 rounded-2xl bg-white" />
        <div className="h-80 rounded-2xl bg-white" />
      </div>
    </div>
  </main>
);

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setOrder(null);
      setError("No order ID was provided.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getOrderById(orderId);

      if (!data?.order) {
        throw new Error("The requested order could not be found.");
      }

      setOrder(data.order);
    } catch (err) {
      console.error("Order details error:", err);
      setError(err?.message || "Failed to load order details.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleCopyOrderId = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard is not available.");
      }

      await navigator.clipboard.writeText(String(order.id));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error("Copy order ID failed:", err);
      window.prompt("Copy this order ID:", String(order.id));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-[#F5F8F6] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={() => navigate("/admin/orders")}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#205541] transition hover:text-[#153D30]"
          >
            <Icon name="back" className="h-4 w-4" />
            Back to orders
          </button>

          <section
            role="alert"
            className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm sm:p-10"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Icon name="alert" className="h-7 w-7" />
            </span>

            <h1 className="mt-5 text-xl font-bold text-[#17231F]">
              Unable to load order
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#748078]">
              {error || "The requested order could not be found."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={fetchOrder}
                className="inline-flex items-center gap-2 rounded-xl bg-[#153D30] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#205541]"
              >
                <Icon name="refresh" className="h-4 w-4" />
                Try again
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin/orders")}
                className="rounded-xl border border-[#DCE5DF] bg-white px-5 py-3 text-sm font-semibold text-[#34453B] transition hover:bg-[#F5F8F6]"
              >
                View all orders
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const orderStatus = String(order.status || "unknown").toLowerCase();
  const payment = order.payment;
  const orderNumber = order.order_number || order.id || orderId;

  return (
    <main className="min-h-screen bg-[#F5F8F6] px-4 py-6 text-[#17231F] sm:px-6 sm:py-8 lg:px-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-7xl">
        {/* Navigation */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <button
            type="button"
            onClick={() => navigate("/admin/orders")}
            className="group inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-[#526259] transition hover:text-[#153D30]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E9E4] bg-white transition group-hover:border-[#B8D2C0] group-hover:bg-[#EAF3ED]">
              <Icon name="back" className="h-4 w-4" />
            </span>
            Back to orders
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl border border-[#DCE5DF] bg-white px-4 py-2.5 text-sm font-semibold text-[#34453B] shadow-sm transition hover:border-[#B8D2C0] hover:bg-[#F8FBF9]"
          >
            <Icon name="print" className="h-4 w-4" />
            Print details
          </button>
        </div>

        {/* Order header */}
        <section className="relative mb-6 overflow-hidden rounded-2xl border border-[#DDE8E0] bg-white shadow-sm">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#153D30] via-[#15803D] to-[#D9F99D]" />

          <div className="p-5 pt-7 sm:p-7 sm:pt-9">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#EAF3ED] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#205541]">
                    <Icon name="receipt" className="h-3.5 w-3.5" />
                    Order details
                  </span>

                  <StatusBadge status={orderStatus} />
                </div>

                <h1 className="mt-4 break-words text-2xl font-extrabold tracking-tight text-[#17231F] sm:text-3xl">
                  {orderNumber}
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#748078]">
                  <span className="inline-flex items-center gap-2">
                    <Icon name="calendar" className="h-4 w-4" />
                    {formatDate(order.created_at)}
                  </span>

                  <span className="inline-flex items-center gap-2">
                    <Icon name="bag" className="h-4 w-4" />
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-[#8A958E]">
                    Order ID
                  </span>

                  <code className="max-w-full break-all rounded-lg bg-[#F5F8F6] px-2.5 py-1.5 text-xs text-[#526259]">
                    {order.id || orderId}
                  </code>

                  <button
                    type="button"
                    onClick={handleCopyOrderId}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#205541] transition hover:bg-[#EAF3ED]"
                    aria-label="Copy order ID"
                  >
                    <Icon
                      name={copied ? "check" : "copy"}
                      className="h-3.5 w-3.5"
                    />
                    {copied ? "Copied" : "Copy ID"}
                  </button>
                </div>
              </div>

              <div className="flex min-w-0 flex-col rounded-2xl border border-[#DDE8E0] bg-[#F5F8F6] p-5 sm:min-w-[230px]">
                <p className="text-xs font-bold uppercase tracking-wider text-[#748078]">
                  Total order value
                </p>

                <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#153D30]">
                  {formatCurrency(order.total)}
                </p>

                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-[#627167]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#DDEFE2] text-[#15803D]">
                    <Icon name="shield" className="h-3.5 w-3.5" />
                  </span>
                  SmartCart transaction record
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main content */}
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
          <div className="min-w-0 space-y-6">
            {/* Products */}
            <section className="overflow-hidden rounded-2xl border border-[#E2E9E4] bg-white shadow-sm">
              <SectionHeading
                icon="package"
                title="Purchased items"
                description="Products included in this transaction"
                trailing={
                  <span className="rounded-lg bg-[#F5F8F6] px-3 py-1.5 text-xs font-bold text-[#526259]">
                    {items.length} {items.length === 1 ? "product" : "products"}
                  </span>
                }
              />

              {items.length === 0 ? (
                <div className="px-5 py-12 text-center sm:px-6">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5F8F6] text-[#748078]">
                    <Icon name="package" className="h-6 w-6" />
                  </span>
                  <p className="mt-4 font-semibold text-[#34453B]">
                    No products found
                  </p>
                  <p className="mt-1 text-sm text-[#748078]">
                    There are no item records attached to this order.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop/tablet table */}
                  <div className="hidden overflow-x-auto sm:block">
                    <table className="w-full min-w-[570px] text-left">
                      <thead className="bg-[#F8FAF8] text-[11px] font-bold uppercase tracking-wider text-[#748078]">
                        <tr>
                          <th className="px-5 py-4 sm:px-6">Product</th>
                          <th className="px-4 py-4 text-center">Qty</th>
                          <th className="px-4 py-4 text-right">Unit price</th>
                          <th className="px-5 py-4 text-right sm:px-6">
                            Subtotal
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-[#EDF1EE]">
                        {items.map((item, index) => (
                          <tr
                            key={item.id ?? `${item.product_name}-${index}`}
                            className="transition hover:bg-[#FAFCFA]"
                          >
                            <td className="px-5 py-5 sm:px-6">
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E2E9E4] bg-[#F5F8F6] text-[#205541]">
                                  <Icon
                                    name="bag"
                                    className="h-5 w-5"
                                  />
                                </span>

                                <div className="min-w-0">
                                  <p className="break-words text-sm font-bold text-[#24352B]">
                                    {item.product_name || "Unnamed product"}
                                  </p>

                                  {item.barcode && (
                                    <p className="mt-1 break-all font-mono text-xs text-[#8A958E]">
                                      SKU / Barcode: {item.barcode}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-5 text-center">
                              <span className="inline-flex min-w-8 items-center justify-center rounded-lg bg-[#F5F8F6] px-2 py-1.5 text-sm font-bold text-[#34453B]">
                                {Number(item.quantity) || 0}
                              </span>
                            </td>

                            <td className="px-4 py-5 text-right text-sm text-[#526259]">
                              {formatCurrency(item.unit_price)}
                            </td>

                            <td className="px-5 py-5 text-right text-sm font-bold text-[#24352B] sm:px-6">
                              {formatCurrency(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile product cards */}
                  <div className="divide-y divide-[#EDF1EE] sm:hidden">
                    {items.map((item, index) => (
                      <article
                        key={item.id ?? `${item.product_name}-${index}`}
                        className="p-5"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3ED] text-[#205541]">
                            <Icon name="bag" />
                          </span>

                          <div className="min-w-0 flex-1">
                            <p className="break-words text-sm font-bold text-[#24352B]">
                              {item.product_name || "Unnamed product"}
                            </p>

                            {item.barcode && (
                              <p className="mt-1 break-all font-mono text-xs text-[#8A958E]">
                                {item.barcode}
                              </p>
                            )}
                          </div>

                          <p className="shrink-0 text-sm font-extrabold text-[#153D30]">
                            {formatCurrency(item.subtotal)}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between rounded-xl bg-[#F5F8F6] px-3 py-3 text-xs">
                          <span className="text-[#748078]">
                            {formatCurrency(item.unit_price)} per unit
                          </span>

                          <span className="font-bold text-[#34453B]">
                            Quantity: {Number(item.quantity) || 0}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E2E9E4] bg-[#FAFCFA] px-5 py-4 sm:px-6">
                <span className="text-sm text-[#748078]">
                  Total line items
                </span>
                <span className="text-sm font-bold text-[#34453B]">
                  {items.reduce(
                    (total, item) => total + (Number(item.quantity) || 0),
                    0
                  )}{" "}
                  units
                </span>
              </div>
            </section>

            {/* Payment information */}
            <section className="overflow-hidden rounded-2xl border border-[#E2E9E4] bg-white shadow-sm">
              <SectionHeading
                icon="card"
                title="Payment information"
                description="Payment method and transaction reference"
              />

              {payment ? (
                <div className="grid gap-0 sm:grid-cols-2">
                  <div className="border-b border-[#EDF1EE] p-5 sm:border-r sm:px-6 sm:py-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#8A958E]">
                      Payment method
                    </p>
                    <p className="mt-2 break-words text-sm font-bold text-[#24352B]">
                      {formatLabel(payment.method)}
                    </p>
                  </div>

                  <div className="border-b border-[#EDF1EE] p-5 sm:px-6 sm:py-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#8A958E]">
                      Payment status
                    </p>
                    <div className="mt-2">
                      <StatusBadge
                        status={payment.status}
                        type="payment"
                      />
                    </div>
                  </div>

                  <div className="p-5 sm:col-span-2 sm:px-6 sm:py-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#8A958E]">
                      Transaction reference
                    </p>

                    <p className="mt-2 break-all font-mono text-sm text-[#526259]">
                      {payment.payment_reference || "No reference available"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <Icon
                      name="alert"
                      className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
                    />
                    <div>
                      <p className="text-sm font-bold text-amber-900">
                        Payment information unavailable
                      </p>
                      <p className="mt-1 text-sm leading-5 text-amber-800">
                        No payment record is attached to this order.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Order summary */}
          <aside className="space-y-6 xl:sticky xl:top-6">
            <section className="overflow-hidden rounded-2xl border border-[#DDE8E0] bg-white shadow-sm">
              <SectionHeading
                icon="receipt"
                title="Order summary"
                description="Final transaction breakdown"
              />

              <div className="space-y-5 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-[#748078]">Subtotal</span>
                  <span className="font-semibold tabular-nums text-[#34453B]">
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-[#748078]">Discount</span>
                  <span className="font-semibold tabular-nums text-[#15803D]">
                    −{formatCurrency(order.discount)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-[#748078]">Tax</span>
                  <span className="font-semibold tabular-nums text-[#34453B]">
                    {formatCurrency(order.tax)}
                  </span>
                </div>

                <div className="border-t border-dashed border-[#DCE5DF]" />

                <div className="rounded-xl bg-[#F5F8F6] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-bold text-[#34453B]">
                      Grand total
                    </span>
                    <span className="text-xl font-extrabold tabular-nums tracking-tight text-[#153D30]">
                      {formatCurrency(order.total)}
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-[#748078]">
                    Final amount recorded for this order.
                  </p>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-[#DDE8E0] bg-white p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF3ED] text-[#205541]">
                    <Icon name="shield" className="h-4 w-4" />
                  </span>

                  <div>
                    <p className="text-xs font-bold text-[#34453B]">
                      Transaction overview
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#748078]">
                      Status: {formatLabel(orderStatus)}. Created{" "}
                      {formatDate(order.created_at)}.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <button
              type="button"
              onClick={() => navigate("/admin/orders")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#153D30] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#205541] focus:outline-none focus:ring-4 focus:ring-[#DDEFE2] print:hidden"
            >
              <Icon name="back" className="h-4 w-4" />
              Return to all orders
            </button>
          </aside>
        </div>

        <footer className="mt-8 border-t border-[#E2E9E4] py-5 text-center text-xs text-[#8A958E] print:hidden">
          SmartCart Admin · Order transaction details
        </footer>
      </div>
    </main>
  );
};

export default OrderDetails;
