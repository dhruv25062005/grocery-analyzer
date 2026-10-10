import { useCallback, useEffect, useMemo, useState } from "react";
import { getAllPayments } from "../../services/paymentService";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(Number(value)) ? Number(value) : 0);

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatLabel = (value) =>
  String(value || "unknown")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const Icon = ({ name, className = "h-5 w-5" }) => {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const icons = {
    wallet: (
      <>
        <rect x="3" y="5" width="18" height="15" rx="2.5" />
        <path d="M3 9h18M16 14h2" />
        <path d="M6 5V3h12v2" />
      </>
    ),
    success: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),
    pending: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    failed: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m9 9 6 6m0-6-6 6" />
      </>
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    filter: <path d="M4 6h16M7 12h10m-7 6h4" />,
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M5.5 9a7 7 0 0 1 11.9-2L20 12M4 12l2.6 5a7 7 0 0 0 11.9-2" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    receipt: (
      <>
        <path d="M5 3 7 5l2-2 3 2 3-2 2 2 2-2v18l-2-2-3 2-3-2-2 2-2-2-2 2V3Z" />
        <path d="M9 9h6M9 13h6M9 17h3" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    close: <path d="m18 6-12 12M6 6l12 12" />,
    alert: (
      <>
        <path d="M12 3 2.5 20h19L12 3Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    card: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <path d="M2 10h20M7 15h3" />
      </>
    ),
  };

  return <svg {...common}>{icons[name] || icons.wallet}</svg>;
};

const StatusBadge = ({ status }) => {
  const value = String(status || "unknown").toLowerCase();

  let styles = "border-slate-200 bg-slate-100 text-slate-600";
  let icon = "pending";

  if (
    ["paid", "completed", "success", "successful", "captured"].includes(value)
  ) {
    styles = "border-emerald-200 bg-emerald-50 text-emerald-700";
    icon = "success";
  } else if (
    ["pending", "processing", "initiated"].includes(value)
  ) {
    styles = "border-amber-200 bg-amber-50 text-amber-700";
    icon = "pending";
  } else if (
    ["failed", "cancelled", "canceled", "refunded", "rejected"].includes(value)
  ) {
    styles = "border-rose-200 bg-rose-50 text-rose-700";
    icon = "failed";
  }

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold ${styles}`}
    >
      <Icon name={icon} className="h-3.5 w-3.5" />
      {formatLabel(value)}
    </span>
  );
};

const StatCard = ({ title, value, description, icon, tone, loading }) => {
  const tones = {
    green: "bg-[#EAF3ED] text-[#205541]",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700",
    neutral: "bg-[#F1F5F2] text-[#526259]",
  };

  return (
    <article className="rounded-2xl border border-[#E2E9E4] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#748078]">{title}</p>

          {loading ? (
            <div className="mt-3 h-8 w-28 animate-pulse rounded-lg bg-[#EDF1EE]" />
          ) : (
            <p className="mt-2 break-words text-2xl font-extrabold tracking-tight text-[#17231F] sm:text-3xl">
              {value}
            </p>
          )}

          <p className="mt-2 text-xs leading-5 text-[#8A958E]">
            {description}
          </p>
        </div>

        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          <Icon name={icon} />
        </span>
      </div>
    </article>
  );
};

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllPayments();
      const list = Array.isArray(data?.payments) ? data.payments : [];

      setPayments(list);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load payments:", err);
      setError(err?.message || "Failed to load payments. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const stats = useMemo(() => {
    const getStatus = (payment) =>
      String(payment.status || "unknown").toLowerCase();

    const paid = payments.filter((payment) => getStatus(payment) === "paid");
    const pending = payments.filter(
      (payment) => getStatus(payment) === "pending"
    );
    const failed = payments.filter(
      (payment) => getStatus(payment) === "failed"
    );

    const paidRevenue = paid.reduce(
      (sum, payment) => sum + (Number(payment.amount) || 0),
      0
    );

    return {
      total: payments.length,
      paid: paid.length,
      pending: pending.length,
      failed: failed.length,
      paidRevenue,
    };
  }, [payments]);

  const availableStatuses = useMemo(
    () =>
      Array.from(
        new Set(
          payments.map((payment) =>
            String(payment.status || "unknown").toLowerCase()
          )
        )
      ).sort(),
    [payments]
  );

  const filteredPayments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const searchable = [
        payment.id,
        payment.order_number,
        payment.payment_reference,
        payment.method,
        payment.status,
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !term || searchable.includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        String(payment.status || "unknown").toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  const hasActiveFilters = search.trim() !== "" || statusFilter !== "all";

  return (
    <main className="min-h-screen bg-[#F5F8F6] px-4 py-6 text-[#17231F] sm:px-6 sm:py-8 xl:px-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}
        <header className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#15803D]">
              <span className="h-2 w-2 rounded-full bg-[#15803D]" />
              SmartCart Administration
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-[#17231F] sm:text-4xl">
              Payments
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#748078] sm:text-base">
              Monitor payment transactions, verify statuses, and track
              collected revenue.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {lastUpdated && !loading && (
              <span className="text-xs text-[#8A958E]">
                Updated{" "}
                {lastUpdated.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}

            <button
              type="button"
              onClick={loadPayments}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCE5DF] bg-white px-4 py-3 text-sm font-semibold text-[#34453B] shadow-sm transition hover:border-[#B8D2C0] hover:bg-[#F8FBF9] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Icon
                name="refresh"
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Refreshing..." : "Refresh payments"}
            </button>
          </div>
        </header>

        {/* Statistics */}
        <section
          aria-label="Payment statistics"
          className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
        >
          <StatCard
            title="Total payments"
            value={stats.total.toLocaleString("en-IN")}
            description="All recorded transactions"
            icon="wallet"
            tone="neutral"
            loading={loading && payments.length === 0}
          />

          <StatCard
            title="Paid"
            value={stats.paid.toLocaleString("en-IN")}
            description="Successfully paid transactions"
            icon="success"
            tone="green"
            loading={loading && payments.length === 0}
          />

          <StatCard
            title="Pending"
            value={stats.pending.toLocaleString("en-IN")}
            description="Awaiting payment completion"
            icon="pending"
            tone="amber"
            loading={loading && payments.length === 0}
          />

          <StatCard
            title="Failed"
            value={stats.failed.toLocaleString("en-IN")}
            description="Failed payment transactions"
            icon="failed"
            tone="red"
            loading={loading && payments.length === 0}
          />

          <StatCard
            title="Paid revenue"
            value={formatCurrency(stats.paidRevenue)}
            description="Sum of payments marked paid"
            icon="card"
            tone="green"
            loading={loading && payments.length === 0}
          />
        </section>

        {/* Status filters */}
        {!loading && !error && payments.length > 0 && (
          <section className="mb-6 rounded-2xl border border-[#E2E9E4] bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <Icon name="filter" className="h-4 w-4 text-[#526259]" />
              <h2 className="text-sm font-bold text-[#34453B]">
                Payment status
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  statusFilter === "all"
                    ? "border-[#153D30] bg-[#153D30] text-white"
                    : "border-[#E2E9E4] bg-white text-[#526259] hover:bg-[#F5F8F6]"
                }`}
              >
                All <span className="ml-1 opacity-80">{stats.total}</span>
              </button>

              {availableStatuses.map((status) => {
                const count = payments.filter(
                  (payment) =>
                    String(payment.status || "unknown").toLowerCase() === status
                ).length;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      statusFilter === status
                        ? "border-[#153D30] bg-[#153D30] text-white"
                        : "border-[#E2E9E4] bg-white text-[#526259] hover:bg-[#F5F8F6]"
                    }`}
                  >
                    {formatLabel(status)}
                    <span className="ml-1 opacity-80">{count}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Payments table */}
        <section className="overflow-hidden rounded-2xl border border-[#E2E9E4] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#E2E9E4] px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#17231F]">
                Transaction history
              </h2>

              <p className="mt-1 text-sm text-[#748078]">
                {loading
                  ? "Loading payment records..."
                  : `Showing ${filteredPayments.length} of ${payments.length} payments`}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <label className="relative min-w-0 flex-1 sm:min-w-[260px] lg:w-80 lg:flex-none">
                <span className="sr-only">Search payments</span>

                <Icon
                  name="search"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A958E]"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search payment, order, reference..."
                  className="w-full rounded-xl border border-[#DCE5DF] bg-[#FCFDFC] py-3 pl-10 pr-10 text-sm text-[#17231F] outline-none transition placeholder:text-[#9AA59E] focus:border-[#6B9C7A] focus:ring-4 focus:ring-[#EAF3ED]"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#748078] hover:bg-[#EAF3ED]"
                  >
                    <Icon name="close" className="h-4 w-4" />
                  </button>
                )}
              </label>

              <label className="relative sm:min-w-[165px]">
                <span className="sr-only">Filter by payment status</span>

                <Icon
                  name="filter"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#748078]"
                />

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-[#DCE5DF] bg-white py-3 pl-10 pr-9 text-sm font-semibold text-[#34453B] outline-none transition focus:border-[#6B9C7A] focus:ring-4 focus:ring-[#EAF3ED]"
                >
                  <option value="all">All statuses</option>

                  {availableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {formatLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div
              role="alert"
              className="m-5 flex flex-col gap-4 rounded-xl border border-rose-200 bg-rose-50 p-5 sm:m-6 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <Icon
                  name="alert"
                  className="mt-0.5 h-5 w-5 shrink-0 text-rose-600"
                />

                <div>
                  <p className="font-bold text-rose-800">
                    Failed to load payments
                  </p>
                  <p className="mt-1 text-sm leading-5 text-rose-700">
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={loadPayments}
                disabled={loading}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#153D30] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#205541] disabled:opacity-60"
              >
                <Icon name="refresh" className="h-4 w-4" />
                Retry
              </button>
            </div>
          )}

          {/* Initial loading */}
          {loading && payments.length === 0 ? (
            <div className="space-y-3 p-5 sm:p-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex animate-pulse items-center gap-4 rounded-xl border border-[#EDF1EE] p-4"
                >
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 rounded bg-slate-200" />
                    <div className="h-3 w-20 rounded bg-slate-100" />
                  </div>
                  <div className="hidden h-4 w-20 rounded bg-slate-100 sm:block" />
                  <div className="h-5 w-16 rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          ) : !error && filteredPayments.length === 0 ? (
            <div className="px-5 py-16 text-center sm:px-8">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3ED] text-[#205541]">
                <Icon name="receipt" className="h-7 w-7" />
              </span>

              <h3 className="mt-4 text-base font-bold text-[#24352B]">
                {payments.length === 0
                  ? "No payments yet"
                  : "No matching payments"}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#748078]">
                {payments.length === 0
                  ? "Payment transactions will appear here when payment records are created."
                  : "Try another search term or clear your selected filters."}
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-xl bg-[#153D30] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#205541]"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : !error ? (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1050px] text-left">
                  <thead className="bg-[#F8FAF8] text-[11px] font-bold uppercase tracking-wider text-[#748078]">
                    <tr>
                      <th className="px-5 py-4">Payment</th>
                      <th className="px-5 py-4">Order</th>
                      <th className="px-5 py-4">Reference</th>
                      <th className="px-5 py-4 text-right">Amount</th>
                      <th className="px-5 py-4">Method</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Paid at</th>
                      <th className="px-5 py-4">Created</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#EDF1EE]">
                    {filteredPayments.map((payment, index) => (
                      <tr
                        key={payment.id ?? index}
                        className="transition hover:bg-[#F8FBF9]"
                      >
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3ED] text-[#205541]">
                              <Icon name="wallet" />
                            </span>

                            <div>
                              <p className="text-sm font-bold text-[#24352B]">
                                Payment #{payment.id ?? "—"}
                              </p>
                              <p className="mt-1 text-xs text-[#8A958E]">
                                Transaction record
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <span className="text-sm font-semibold text-[#34453B]">
                            {payment.order_number || "—"}
                          </span>
                        </td>

                        <td className="max-w-[200px] px-5 py-5">
                          <span
                            title={payment.payment_reference || ""}
                            className="block break-all font-mono text-xs text-[#627167]"
                          >
                            {payment.payment_reference || "—"}
                          </span>
                        </td>

                        <td className="px-5 py-5 text-right">
                          <span className="whitespace-nowrap text-sm font-extrabold text-[#24352B]">
                            {formatCurrency(payment.amount)}
                          </span>
                        </td>

                        <td className="px-5 py-5">
                          <span className="inline-flex items-center gap-2 text-sm text-[#526259]">
                            <Icon
                              name="card"
                              className="h-4 w-4 text-[#8A958E]"
                            />
                            {formatLabel(payment.method || "—")}
                          </span>
                        </td>

                        <td className="px-5 py-5">
                          <StatusBadge status={payment.status} />
                        </td>

                        <td className="px-5 py-5 text-xs leading-5 text-[#627167]">
                          {formatDate(payment.paid_at)}
                        </td>

                        <td className="px-5 py-5 text-xs leading-5 text-[#627167]">
                          {formatDate(payment.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile payment cards */}
              <div className="divide-y divide-[#EDF1EE] md:hidden">
                {filteredPayments.map((payment, index) => (
                  <article
                    key={payment.id ?? index}
                    className="p-4 sm:p-5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF3ED] text-[#205541]">
                        <Icon name="wallet" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="break-words text-sm font-bold text-[#24352B]">
                              Payment #{payment.id ?? "—"}
                            </h3>
                            <p className="mt-1 break-words text-xs text-[#8A958E]">
                              Order: {payment.order_number || "—"}
                            </p>
                          </div>

                          <StatusBadge status={payment.status} />
                        </div>

                        <div className="mt-4 rounded-xl bg-[#F5F8F6] p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A958E]">
                            Payment amount
                          </p>
                          <p className="mt-1 break-words text-xl font-extrabold text-[#153D30]">
                            {formatCurrency(payment.amount)}
                          </p>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4">
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A958E]">
                              Method
                            </p>
                            <p className="mt-1 break-words text-sm font-semibold text-[#34453B]">
                              {formatLabel(payment.method || "—")}
                            </p>
                          </div>

                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A958E]">
                              Paid at
                            </p>
                            <p className="mt-1 break-words text-xs leading-5 text-[#526259]">
                              {formatDate(payment.paid_at)}
                            </p>
                          </div>

                          <div className="col-span-2 min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A958E]">
                              Payment reference
                            </p>
                            <p className="mt-1 break-all font-mono text-xs leading-5 text-[#526259]">
                              {payment.payment_reference || "—"}
                            </p>
                          </div>

                          <div className="col-span-2 min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A958E]">
                              Created
                            </p>
                            <p className="mt-1 text-xs leading-5 text-[#526259]">
                              {formatDate(payment.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : null}

          {/* Footer */}
          {!loading && !error && filteredPayments.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-[#E2E9E4] bg-[#FAFCFA] px-5 py-4 text-xs text-[#748078] sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span>
                Displaying {filteredPayments.length}{" "}
                {filteredPayments.length === 1 ? "payment" : "payments"}
              </span>

              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#15803D]" />
                Payment records loaded from SmartCart
              </span>
            </div>
          )}
        </section>

        <footer className="mt-7 pb-4 text-center text-xs text-[#8A958E]">
          SmartCart Admin · Payment Management
        </footer>
      </div>
    </main>
  );
};

export default Payments;
