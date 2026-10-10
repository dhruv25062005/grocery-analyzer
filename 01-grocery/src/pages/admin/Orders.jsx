import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllOrders } from "../../services/orderService";


const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(Number(value)) ? Number(value) : 0);

const formatDate = (date) => {
  if (!date) return "N/A";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
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
    orders: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
    paid: (
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
    revenue: (
      <>
        <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
        <path d="M2.5 10h19M7 15h3" />
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
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
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
    close: <path d="m18 6-12 12M6 6l12 12" />,
    alert: (
      <>
        <path d="M12 3 2.5 20h19L12 3Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    receipt: (
      <>
        <path d="M5 3 7 5l2-2 3 2 3-2 2 2 2-2v18l-2-2-3 2-3-2-2 2-2-2-2 2V3Z" />
        <path d="M9 9h6M9 13h6M9 17h3" />
      </>
    ),
  };

  return <svg {...common}>{icons[name] || icons.orders}</svg>;
};

const StatusBadge = ({ status }) => {
  const value = String(status || "unknown").toLowerCase();

  let color = "border-slate-200 bg-slate-100 text-slate-600";

  if (["paid", "completed", "success", "successful"].includes(value)) {
    color = "border-emerald-200 bg-emerald-50 text-emerald-700";
  } else if (["pending", "processing", "initiated"].includes(value)) {
    color = "border-amber-200 bg-amber-50 text-amber-700";
  } else if (
    ["cancelled", "canceled", "failed", "refunded", "rejected"].includes(value)
  ) {
    color = "border-rose-200 bg-rose-50 text-rose-700";
  }

  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold ${color}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {formatLabel(value)}
    </span>
  );
};

const StatCard = ({
  title,
  value,
  description,
  icon,
  tone,
  loading,
}) => {
  const tones = {
    green: "bg-[#EAF3ED] text-[#205541]",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
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
          <Icon name={icon} className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
};

const TableSkeleton = () => (
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
);

const Orders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllOrders();
      const list = Array.isArray(data?.orders) ? data.orders : [];

      setOrders(list);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Orders error:", err);
      setError(err?.message || "Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const orderStats = useMemo(() => {
    const paid = orders.filter(
      (order) => String(order.status || "").toLowerCase() === "paid"
    );

    const pending = orders.filter(
      (order) => String(order.status || "").toLowerCase() === "pending"
    );

    return {
      totalOrders: orders.length,
      paidOrders: paid.length,
      pendingOrders: pending.length,
      totalRevenue: paid.reduce(
        (total, order) => total + (Number(order.total) || 0),
        0
      ),
    };
  }, [orders]);

  const statusCounts = useMemo(
    () =>
      orders.reduce((counts, order) => {
        const status = String(order.status || "unknown").toLowerCase();
        counts[status] = (counts[status] || 0) + 1;
        return counts;
      }, {}),
    [orders]
  );

  const availableStatuses = useMemo(
    () =>
      Array.from(
        new Set(
          orders.map((order) =>
            String(order.status || "unknown").toLowerCase()
          )
        )
      ).sort(),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    return orders.filter((order) => {
      const searchable = [
        order.order_number,
        order.id,
        order.status,
        order.payment?.method,
        order.payment?.payment_reference,
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !term || searchable.includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        String(order.status || "unknown").toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  const hasActiveFilters = search.trim() !== "" || statusFilter !== "all";

  return (
    <main className="min-h-screen bg-[#F5F8F6] px-4 py-6 text-[#17231F] sm:px-6 sm:py-8 xl:px-8">
      <div className="mx-auto max-w-[1500px]">

        {/* Page heading */}
        <header className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#15803D]">
              <span className="h-2 w-2 rounded-full bg-[#15803D]" />
              SmartCart Administration
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-[#17231F] sm:text-4xl">
              Orders
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#748078] sm:text-base">
              Track transactions, monitor payment statuses, and review customer
              orders.
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
              onClick={fetchOrders}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCE5DF] bg-white px-4 py-3 text-sm font-semibold text-[#34453B] shadow-sm transition hover:border-[#B8D2C0] hover:bg-[#F8FBF9] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Icon
                name="refresh"
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Refreshing..." : "Refresh orders"}
            </button>
          </div>
        </header>

        {/* Statistics */}
        <section
          aria-label="Order statistics"
          className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard
            title="Total orders"
            value={orderStats.totalOrders.toLocaleString("en-IN")}
            description="All recorded transactions"
            icon="orders"
            tone="neutral"
            loading={loading && orders.length === 0}
          />

          <StatCard
            title="Paid orders"
            value={orderStats.paidOrders.toLocaleString("en-IN")}
            description={`${
              orderStats.totalOrders
                ? Math.round(
                    (orderStats.paidOrders / orderStats.totalOrders) * 100
                  )
                : 0
            }% of all orders`}
            icon="paid"
            tone="green"
            loading={loading && orders.length === 0}
          />

          <StatCard
            title="Pending orders"
            value={orderStats.pendingOrders.toLocaleString("en-IN")}
            description="Awaiting payment completion"
            icon="pending"
            tone="amber"
            loading={loading && orders.length === 0}
          />

          <StatCard
            title="Paid revenue"
            value={formatCurrency(orderStats.totalRevenue)}
            description="Revenue from paid orders only"
            icon="revenue"
            tone="blue"
            loading={loading && orders.length === 0}
          />
        </section>

        {/* Status overview */}
        {!loading && !error && orders.length > 0 && (
          <section className="mb-6 rounded-2xl border border-[#E2E9E4] bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <Icon name="filter" className="h-4 w-4 text-[#526259]" />
              <h2 className="text-sm font-bold text-[#34453B]">
                Status overview
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
                All <span className="ml-1 opacity-80">{orders.length}</span>
              </button>

              {availableStatuses.map((status) => (
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
                  <span className="ml-1 opacity-80">
                    {statusCounts[status] || 0}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Order history */}
        <section className="overflow-hidden rounded-2xl border border-[#E2E9E4] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#E2E9E4] px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#17231F]">
                Order history
              </h2>

              <p className="mt-1 text-sm text-[#748078]">
                {loading
                  ? "Loading order records..."
                  : `Showing ${filteredOrders.length} of ${orders.length} orders`}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <label className="relative min-w-0 flex-1 sm:min-w-[260px] lg:w-72 lg:flex-none">
                <span className="sr-only">Search orders</span>

                <Icon
                  name="search"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A958E]"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search order, ID, payment..."
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
                <span className="sr-only">Filter by order status</span>

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
                    Failed to load orders
                  </p>
                  <p className="mt-1 text-sm leading-5 text-rose-700">
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fetchOrders}
                disabled={loading}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#153D30] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#205541] disabled:opacity-60"
              >
                <Icon name="refresh" className="h-4 w-4" />
                Retry
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && orders.length === 0 ? (
            <TableSkeleton />
          ) : !error && filteredOrders.length === 0 ? (
            <div className="px-5 py-16 text-center sm:px-8">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3ED] text-[#205541]">
                <Icon name="receipt" className="h-7 w-7" />
              </span>

              <h3 className="mt-4 text-base font-bold text-[#24352B]">
                {orders.length === 0 ? "No orders yet" : "No matching orders"}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#748078]">
                {orders.length === 0
                  ? "Customer orders will appear here once transactions are recorded."
                  : "Try a different search term or clear your selected filters."}
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
                <table className="w-full min-w-[850px] text-left">
                  <thead className="bg-[#F8FAF8] text-[11px] font-bold uppercase tracking-wider text-[#748078]">
                    <tr>
                      <th className="px-6 py-4">Order</th>
                      <th className="px-5 py-4">Date</th>
                      <th className="px-5 py-4 text-center">Items</th>
                      <th className="px-5 py-4 text-right">Subtotal</th>
                      <th className="px-5 py-4 text-right">Total</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Details</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#EDF1EE]">
                    {filteredOrders.map((order, index) => (
                      <tr
                        key={order.id ?? order.order_number ?? index}
                        className="cursor-pointer transition hover:bg-[#F8FBF9] focus-within:bg-[#F8FBF9]"
                        onClick={() =>
                          navigate(`/admin/orders/${order.id}`)
                        }
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3ED] text-[#205541]">
                              <Icon name="bag" className="h-5 w-5" />
                            </span>

                            <div className="min-w-0">
                              <p className="max-w-[190px] break-words text-sm font-bold text-[#24352B]">
                                {order.order_number || "Order"}
                              </p>
                              <p className="mt-1 text-xs text-[#8A958E]">
                                ID: {order.id ?? "N/A"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5 text-sm text-[#627167]">
                          <span className="block max-w-[150px] leading-5">
                            {formatDate(order.created_at)}
                          </span>
                        </td>

                        <td className="px-5 py-5 text-center text-sm font-semibold text-[#526259]">
                          {Number(order.total_items) || 0}
                        </td>

                        <td className="px-5 py-5 text-right text-sm text-[#526259]">
                          {formatCurrency(order.subtotal)}
                        </td>

                        <td className="px-5 py-5 text-right text-sm font-extrabold text-[#24352B]">
                          {formatCurrency(order.total)}
                        </td>

                        <td className="px-5 py-5">
                          <StatusBadge status={order.status} />
                        </td>

                        <td className="px-5 py-5 text-right">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/admin/orders/${order.id}`);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-[#205541] transition hover:bg-[#EAF3ED] focus:outline-none focus:ring-2 focus:ring-[#6B9C7A]"
                          >
                            View
                            <Icon name="arrow" className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-[#EDF1EE] md:hidden">
                {filteredOrders.map((order, index) => (
                  <button
                    key={order.id ?? order.order_number ?? index}
                    type="button"
                    onClick={() =>
                      navigate(`/admin/orders/${order.id}`)
                    }
                    className="block w-full p-4 text-left transition hover:bg-[#F8FBF9] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#6B9C7A] sm:p-5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF3ED] text-[#205541]">
                        <Icon name="bag" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="break-words text-sm font-bold text-[#24352B]">
                              {order.order_number || "Order"}
                            </p>
                            <p className="mt-1 break-all text-xs text-[#8A958E]">
                              Order ID: {order.id ?? "N/A"}
                            </p>
                          </div>

                          <StatusBadge status={order.status} />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#F5F8F6] p-3">
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider text-[#8A958E]">
                              Total
                            </p>
                            <p className="mt-1 break-words text-base font-extrabold text-[#153D30]">
                              {formatCurrency(order.total)}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-[11px] font-medium uppercase tracking-wider text-[#8A958E]">
                              Items
                            </p>
                            <p className="mt-1 text-sm font-bold text-[#34453B]">
                              {Number(order.total_items) || 0}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#748078]">
                          <span className="inline-flex items-center gap-1.5">
                            <Icon name="calendar" className="h-3.5 w-3.5" />
                            {formatDate(order.created_at)}
                          </span>

                          <span className="inline-flex items-center gap-1 font-bold text-[#205541]">
                            View details
                            <Icon name="arrow" className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {/* Table footer */}
          {!loading && !error && filteredOrders.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-[#E2E9E4] bg-[#FAFCFA] px-5 py-4 text-xs text-[#748078] sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span>
                Displaying {filteredOrders.length}{" "}
                {filteredOrders.length === 1 ? "order" : "orders"}
              </span>

              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#15803D]" />
                Order records loaded from SmartCart
              </span>
            </div>
          )}
        </section>

        <footer className="mt-7 pb-4 text-center text-xs text-[#8A958E]">
          SmartCart Admin · Order Management
        </footer>
      </div>
    </main>
  );
};

export default Orders;
