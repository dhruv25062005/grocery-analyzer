import { useCallback, useEffect, useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import { apiRequest } from "../../services/api";

const INITIAL_SUMMARY = {
  total_orders: 0,
  total_paid_payments: 0,
  total_revenue: 0,
  pending_payments: 0,
  total_products: 0,
  low_stock_products: 0,
};

const currency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const number = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value) || 0);

const dateLabel = (value, options = {}) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    ...options,
  });
};

const fullDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Icon = ({ name, className = "h-5 w-5" }) => {
  const props = {
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
    chart: <>
      <path d="M3 3v18h18" />
      <path d="m7 14 4-4 4 3 6-7" />
    </>,
    orders: <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>,
    revenue: <>
      <path d="M12 2v20m5-15H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </>,
    payment: <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18m-13 5h3" />
    </>,
    inventory: <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 8 9 5 9-5M3 8v9l9 5 9-5V8M12 13v9" />
    </>,
    alert: <>
      <path d="M12 3 2.5 20h19L12 3Z" />
      <path d="M12 9v4m0 4h.01" />
    </>,
    refresh: <>
      <path d="M20 7v5h-5M4 17v-5h5" />
      <path d="M5.5 9a7 7 0 0 1 11.9-2L20 12M4 12l2.6 5a7 7 0 0 0 11.9-2" />
    </>,
    calendar: <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>,
    download: <>
      <path d="M12 3v12m-5-5 5 5 5-5" />
      <path d="M5 17v4h14v-4" />
    </>,
    check: <path d="m5 12 4 4L19 6" />,
    arrow: <path d="m7 17 10-10M7 7h10v10" />,
    empty: <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="m7 15 3-3 3 2 4-5" />
    </>,
  };

  return <svg {...props}>{icons[name] || icons.chart}</svg>;
};

const StatCard = ({ title, value, subtitle, icon, tone, loading }) => {
  const colors = {
    green: "bg-[#EAF3ED] text-[#205541]",
    lime: "bg-lime-50 text-lime-800",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700",
    slate: "bg-[#F1F5F2] text-[#526259]",
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

          <p className="mt-2 text-xs leading-5 text-[#8A958E]">{subtitle}</p>
        </div>

        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colors[tone]}`}>
          <Icon name={icon} />
        </span>
      </div>
    </article>
  );
};

const Panel = ({ title, subtitle, action, children, className = "" }) => (
  <section className={`overflow-hidden rounded-2xl border border-[#E2E9E4] bg-white shadow-sm ${className}`}>
    <div className="flex flex-col gap-3 border-b border-[#EDF1EE] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <h2 className="text-lg font-bold text-[#17231F]">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-[#748078]">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const EmptyState = ({ title, description }) => (
  <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3ED] text-[#205541]">
      <Icon name="empty" className="h-7 w-7" />
    </span>
    <h3 className="mt-4 font-bold text-[#24352B]">{title}</h3>
    <p className="mt-2 max-w-sm text-sm leading-6 text-[#748078]">{description}</p>
  </div>
);

const LoadingRows = ({ count = 5 }) => (
  <div className="space-y-4 p-5 sm:p-6">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="flex animate-pulse items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-[#EDF1EE]" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-36 rounded bg-[#EDF1EE]" />
          <div className="h-3 w-24 rounded bg-[#F3F6F4]" />
        </div>
        <div className="h-4 w-20 rounded bg-[#EDF1EE]" />
      </div>
    ))}
  </div>
);

const SalesChart = ({ sales }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const chart = useMemo(() => {
    const width = 900;
    const height = 290;
    const left = 70;
    const right = 20;
    const top = 25;
    const bottom = 48;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;

    const maxRevenue = Math.max(
      1,
      ...sales.map((item) => Math.max(0, Number(item.revenue) || 0))
    );

    const step = sales.length > 1 ? plotWidth / sales.length : plotWidth;
    const barWidth = Math.max(8, Math.min(38, step * 0.55));

    const bars = sales.map((item, index) => {
      const revenue = Math.max(0, Number(item.revenue) || 0);
      const barHeight = revenue > 0 ? (revenue / maxRevenue) * plotHeight : 0;
      const x = left + index * step + (step - barWidth) / 2;
      const y = top + plotHeight - barHeight;

      return {
        ...item,
        revenue,
        orders: Number(item.orders) || 0,
        x,
        y,
        barWidth,
        barHeight,
        center: x + barWidth / 2,
      };
    });

    const ticks = Array.from({ length: 5 }, (_, index) => {
      const value = (maxRevenue * index) / 4;
      return {
        value,
        y: top + plotHeight - (index / 4) * plotHeight,
      };
    });

    return { width, height, left, right, top, bottom, plotWidth, plotHeight, bars, ticks };
  }, [sales]);

  const labelEvery = Math.max(1, Math.ceil(sales.length / 7));

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#24352B]">Revenue by day</p>
          <p className="mt-1 text-xs text-[#8A958E]">
            Hover or focus on a bar to inspect its values.
          </p>
        </div>

        <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#526259]">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#205541]" />
          Paid revenue
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${chart.width} ${chart.height}`}
          className="block w-full min-w-[620px]"
          role="img"
          aria-label="Daily paid revenue bar chart"
        >
          {chart.ticks.map((tick) => (
            <g key={tick.value}>
              <line
                x1={chart.left}
                y1={tick.y}
                x2={chart.width - chart.right}
                y2={tick.y}
                stroke="#E8EEE9"
                strokeDasharray="4 5"
              />
              <text
                x={chart.left - 12}
                y={tick.y + 4}
                fill="#849087"
                fontSize="11"
                textAnchor="end"
              >
                {tick.value >= 100000
                  ? `₹${(tick.value / 100000).toFixed(1)}L`
                  : tick.value >= 1000
                  ? `₹${(tick.value / 1000).toFixed(1)}k`
                  : `₹${Math.round(tick.value)}`}
              </text>
            </g>
          ))}

          {chart.bars.map((bar, index) => (
            <g
              key={`${bar.date}-${index}`}
              tabIndex={0}
              role="img"
              aria-label={`${fullDate(bar.date)}: ${currency(bar.revenue)}, ${number(bar.orders)} orders`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              className="cursor-pointer outline-none"
            >
              <rect
                x={bar.x}
                y={chart.top}
                width={bar.barWidth}
                height={chart.plotHeight}
                fill="transparent"
              />
              {bar.barHeight > 0 && (
                <rect
                  x={bar.x}
                  y={bar.y}
                  width={bar.barWidth}
                  height={Math.max(2, bar.barHeight)}
                  rx="5"
                  fill={hoveredIndex === index ? "#15803D" : "#205541"}
                  opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.65}
                />
              )}

              {index % labelEvery === 0 && (
                <text
                  x={bar.center}
                  y={chart.height - 15}
                  textAnchor="middle"
                  fill="#748078"
                  fontSize="11"
                >
                  {dateLabel(bar.date)}
                </text>
              )}
            </g>
          ))}

          {hoveredIndex !== null && chart.bars[hoveredIndex] && (
            <g>
              <rect
                x={Math.min(
                  Math.max(chart.left, chart.bars[hoveredIndex].center - 85),
                  chart.width - 180
                )}
                y={Math.max(0, chart.bars[hoveredIndex].y - 52)}
                width="170"
                height="43"
                rx="8"
                fill="#153D30"
              />
              <text
                x={Math.min(
                  Math.max(chart.left, chart.bars[hoveredIndex].center - 85),
                  chart.width - 180
                ) + 10}
                y={Math.max(0, chart.bars[hoveredIndex].y - 52) + 17}
                fill="#D9F99D"
                fontSize="11"
                fontWeight="600"
              >
                {dateLabel(chart.bars[hoveredIndex].date, { year: "numeric" })}
              </text>
              <text
                x={Math.min(
                  Math.max(chart.left, chart.bars[hoveredIndex].center - 85),
                  chart.width - 180
                ) + 10}
                y={Math.max(0, chart.bars[hoveredIndex].y - 52) + 33}
                fill="white"
                fontSize="12"
                fontWeight="700"
              >
                {currency(chart.bars[hoveredIndex].revenue)}
                {" · "}
                {number(chart.bars[hoveredIndex].orders)} orders
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

const Reports = () => {
  const [summary, setSummary] = useState(INITIAL_SUMMARY);
  const [dailySales, setDailySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);
  const [topProductsLoading, setTopProductsLoading] = useState(true);

  const [error, setError] = useState("");
  const [salesError, setSalesError] = useState("");
  const [topProductsError, setTopProductsError] = useState("");

  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState("30");
  const [productSearch, setProductSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/admin/reports");
      setSummary({ ...INITIAL_SUMMARY, ...(data?.summary || {}) });
    } catch (err) {
      console.error("Summary report error:", err);
      setError(err?.message || "Unable to load the summary report.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSales = useCallback(async () => {
    setSalesLoading(true);
    setSalesError("");

    try {
      const data = await apiRequest("/admin/reports/daily-sales");
      setDailySales(Array.isArray(data?.sales) ? data.sales : []);
    } catch (err) {
      console.error("Daily sales error:", err);
      setSalesError(err?.message || "Unable to load daily sales.");
    } finally {
      setSalesLoading(false);
    }
  }, []);

  const loadTopProducts = useCallback(async () => {
    setTopProductsLoading(true);
    setTopProductsError("");

    try {
      const data = await apiRequest("/admin/reports/top-products");
      setTopProducts(Array.isArray(data?.products) ? data.products : []);
    } catch (err) {
      console.error("Top products error:", err);
      setTopProductsError(err?.message || "Unable to load top products.");
    } finally {
      setTopProductsLoading(false);
    }
  }, []);

  const loadReports = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);

    await Promise.allSettled([
      loadSummary(),
      loadSales(),
      loadTopProducts(),
    ]);

    setLastUpdated(new Date());
    setRefreshing(false);
  }, [loadSummary, loadSales, loadTopProducts]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const filteredSales = useMemo(() => {
    const sorted = [...dailySales].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (range === "all") return sorted;

    const days = Number(range);
    if (!Number.isFinite(days)) return sorted;

    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (days - 1));

    return sorted.filter((item) => {
      const date = new Date(item.date);
      if (Number.isNaN(date.getTime())) return false;
      date.setHours(0, 0, 0, 0);
      return date >= cutoff;
    });
  }, [dailySales, range]);

  const salesTotals = useMemo(() => ({
    revenue: filteredSales.reduce(
      (sum, item) => sum + (Number(item.revenue) || 0),
      0
    ),
    orders: filteredSales.reduce(
      (sum, item) => sum + (Number(item.orders) || 0),
      0
    ),
    days: filteredSales.length,
  }), [filteredSales]);

  const filteredTopProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();

    return topProducts.filter((product) =>
      [product.name, product.category, product.brand].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [topProducts, productSearch]);

  const averagePayment = Number(summary.total_paid_payments) > 0
    ? Number(summary.total_revenue) / Number(summary.total_paid_payments)
    : 0;

  const paymentBase =
    Number(summary.total_paid_payments || 0) +
    Number(summary.pending_payments || 0);

  const completionRate = paymentBase > 0
    ? (Number(summary.total_paid_payments || 0) / paymentBase) * 100
    : 0;

  const exportCsv = () => {
    const rows = [
      ["Date", "Paid Orders", "Revenue (INR)"],
      ...filteredSales.map((day) => [
        day.date ?? "",
        Number(day.orders) || 0,
        Number(day.revenue) || 0,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `smartcart-sales-${range === "all" ? "all-time" : `last-${range}-days`}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-[#F5F8F6] text-[#17231F]">
      <AdminSidebar />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
        <div className="mx-auto max-w-[1500px]">
          {/* Header */}
          <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#15803D]">
                <span className="h-2 w-2 rounded-full bg-[#15803D]" />
                SmartCart analytics
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Reports & insights
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#748078] sm:text-base">
                Understand sales performance, payment activity, and inventory
                health from one dashboard.
              </p>

              <p className="mt-3 text-xs text-[#8A958E]">
                {lastUpdated
                  ? `Last refreshed ${lastUpdated.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : "Preparing your reports..."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => loadReports(true)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCE5DF] bg-white px-4 py-3 text-sm font-semibold text-[#34453B] shadow-sm transition hover:bg-[#F8FBF9] disabled:opacity-60"
              >
                <Icon name="refresh" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Refresh reports"}
              </button>

              <button
                type="button"
                onClick={exportCsv}
                disabled={salesLoading || filteredSales.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#153D30] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#205541] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon name="download" className="h-4 w-4" />
                Export sales CSV
              </button>
            </div>
          </header>

          {/* Summary error */}
          {error && (
            <div role="alert" className="mb-6 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-rose-800">Summary unavailable</p>
                <p className="mt-1 text-sm text-rose-700">{error}</p>
              </div>
              <button
                type="button"
                onClick={loadSummary}
                className="rounded-lg bg-[#153D30] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#205541]"
              >
                Retry summary
              </button>
            </div>
          )}

          {/* Main KPI cards */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title="Total orders"
              value={number(summary.total_orders)}
              subtitle="All orders recorded"
              icon="orders"
              tone="green"
              loading={loading}
            />
            <StatCard
              title="Paid payments"
              value={number(summary.total_paid_payments)}
              subtitle="Successfully completed payments"
              icon="payment"
              tone="green"
              loading={loading}
            />
            <StatCard
              title="Total revenue"
              value={currency(summary.total_revenue)}
              subtitle="Revenue from paid payments"
              icon="revenue"
              tone="lime"
              loading={loading}
            />
            <StatCard
              title="Pending payments"
              value={number(summary.pending_payments)}
              subtitle="Payments awaiting completion"
              icon="alert"
              tone="amber"
              loading={loading}
            />
            <StatCard
              title="Active products"
              value={number(summary.total_products)}
              subtitle="Products in the catalogue"
              icon="inventory"
              tone="slate"
              loading={loading}
            />
            <StatCard
              title="Low-stock products"
              value={number(summary.low_stock_products)}
              subtitle="Products reported at 10 units or less"
              icon="alert"
              tone="red"
              loading={loading}
            />
          </section>

          {/* Sales analytics */}
          <section className="mt-8">
            <Panel
              title="Sales performance"
              subtitle="Explore daily paid revenue and order activity."
              action={
                <label className="flex items-center gap-2 text-xs font-semibold text-[#748078]">
                  <Icon name="calendar" className="h-4 w-4" />
                  <span className="sr-only">Sales date range</span>
                  <select
                    value={range}
                    onChange={(event) => setRange(event.target.value)}
                    className="rounded-lg border border-[#DCE5DF] bg-white px-3 py-2.5 text-sm font-semibold text-[#34453B] outline-none focus:border-[#6B9C7A]"
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="all">All returned dates</option>
                  </select>
                </label>
              }
            >
              {salesLoading ? (
                <div className="p-6">
                  <div className="h-64 animate-pulse rounded-xl bg-[#F1F5F2]" />
                </div>
              ) : salesError ? (
                <div className="p-6">
                  <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5">
                    <p className="font-bold text-rose-800">Sales data unavailable</p>
                    <p className="mt-1 text-sm text-rose-700">{salesError}</p>
                    <button
                      type="button"
                      onClick={loadSales}
                      className="mt-4 rounded-lg bg-[#153D30] px-4 py-2 text-sm font-bold text-white hover:bg-[#205541]"
                    >
                      Retry sales data
                    </button>
                  </div>
                </div>
              ) : filteredSales.length === 0 ? (
                <EmptyState
                  title="No sales for this range"
                  description="No daily sales records were returned for the selected period. Try another range or check your backend report."
                />
              ) : (
                <>
                  <div className="grid gap-px border-b border-[#EDF1EE] bg-[#EDF1EE] sm:grid-cols-3">
                    <div className="bg-white p-5 sm:px-6">
                      <p className="text-xs font-semibold text-[#748078]">Revenue in selected data</p>
                      <p className="mt-2 break-words text-2xl font-extrabold text-[#153D30]">
                        {currency(salesTotals.revenue)}
                      </p>
                    </div>
                    <div className="bg-white p-5 sm:px-6">
                      <p className="text-xs font-semibold text-[#748078]">Orders in selected data</p>
                      <p className="mt-2 text-2xl font-extrabold text-[#17231F]">
                        {number(salesTotals.orders)}
                      </p>
                    </div>
                    <div className="bg-white p-5 sm:px-6">
                      <p className="text-xs font-semibold text-[#748078]">Dates with sales records</p>
                      <p className="mt-2 text-2xl font-extrabold text-[#17231F]">
                        {number(salesTotals.days)}
                      </p>
                    </div>
                  </div>

                  <SalesChart sales={filteredSales} />

                  <div className="border-t border-[#EDF1EE] bg-[#FAFCFA] px-5 py-3 text-xs leading-5 text-[#8A958E] sm:px-6">
                    Chart totals use the daily records returned by your API.
                    Missing dates are not automatically treated as zero-sales days.
                  </div>
                </>
              )}
            </Panel>
          </section>

          {/* Business insights */}
          <section className="mt-8 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl bg-[#153D30] p-6 text-white shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#D9F99D]">
                <Icon name="revenue" />
              </span>
              <p className="mt-5 text-sm font-medium text-white/70">
                Average revenue per paid payment
              </p>
              <p className="mt-2 break-words text-2xl font-extrabold">
                {loading ? "—" : currency(averagePayment)}
              </p>
              <p className="mt-2 text-xs leading-5 text-white/60">
                Total revenue divided by the reported number of paid payments.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E2E9E4] bg-white p-6 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3ED] text-[#205541]">
                <Icon name="check" />
              </span>
              <p className="mt-5 text-sm font-medium text-[#748078]">
                Payment completion rate
              </p>
              <p className="mt-2 text-2xl font-extrabold text-[#17231F]">
                {loading ? "—" : `${completionRate.toFixed(1)}%`}
              </p>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#EDF1EE]">
                <div
                  className="h-full rounded-full bg-[#15803D] transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, completionRate))}%` }}
                />
              </div>

              <p className="mt-3 text-xs leading-5 text-[#8A958E]">
                Calculated from paid and pending payments only. Other payment
                statuses may not be included.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-700">
                <Icon name="alert" />
              </span>
              <p className="mt-5 text-sm font-medium text-amber-800">
                Inventory attention
              </p>
              <p className="mt-2 text-2xl font-extrabold text-amber-900">
                {loading ? "—" : number(summary.low_stock_products)}
              </p>
              <p className="mt-2 text-xs leading-5 text-amber-800">
                Products flagged by your summary endpoint as low stock. Review
                inventory before replenishment.
              </p>
            </div>
          </section>

          {/* Top selling products */}
          <section className="mt-8">
            <Panel
              title="Top-selling products"
              subtitle="Ranked products returned by your sales reporting endpoint."
              action={
                <label className="relative block w-full sm:w-64">
                  <Icon
                    name="chart"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A958E]"
                  />
                  <input
                    type="search"
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                    placeholder="Search products..."
                    className="w-full rounded-lg border border-[#DCE5DF] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#6B9C7A] focus:ring-2 focus:ring-[#EAF3ED]"
                  />
                </label>
              }
            >
              {topProductsLoading ? (
                <LoadingRows />
              ) : topProductsError ? (
                <div className="p-6">
                  <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5">
                    <p className="font-bold text-rose-800">Top products unavailable</p>
                    <p className="mt-1 text-sm text-rose-700">{topProductsError}</p>
                    <button
                      type="button"
                      onClick={loadTopProducts}
                      className="mt-4 rounded-lg bg-[#153D30] px-4 py-2 text-sm font-bold text-white hover:bg-[#205541]"
                    >
                      Retry top products
                    </button>
                  </div>
                </div>
              ) : filteredTopProducts.length === 0 ? (
                <EmptyState
                  title={topProducts.length ? "No matching products" : "No product sales yet"}
                  description={
                    topProducts.length
                      ? "Try searching by a different product name, category, or brand."
                      : "Top-selling products will appear here when the backend returns sales data."
                  }
                />
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[720px] text-left">
                      <thead className="bg-[#F8FAF8] text-[11px] font-bold uppercase tracking-wider text-[#748078]">
                        <tr>
                          <th className="px-6 py-4">Rank</th>
                          <th className="px-6 py-4">Product</th>
                          <th className="px-6 py-4">Category</th>
                          <th className="px-6 py-4">Brand</th>
                          <th className="px-6 py-4 text-right">Units sold</th>
                          <th className="px-6 py-4 text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDF1EE]">
                        {filteredTopProducts.map((product, index) => (
                          <tr
                            key={product.id ?? `${product.name}-${index}`}
                            className="transition hover:bg-[#F8FBF9]"
                          >
                            <td className="px-6 py-4">
                              <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-extrabold ${
                                index === 0
                                  ? "bg-[#153D30] text-white"
                                  : index === 1
                                  ? "bg-[#EAF3ED] text-[#205541]"
                                  : index === 2
                                  ? "bg-amber-50 text-amber-800"
                                  : "bg-[#F1F5F2] text-[#526259]"
                              }`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="max-w-xs truncate text-sm font-bold text-[#24352B]">
                                {product.name || "Unnamed product"}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-sm text-[#526259]">
                              {product.category || "—"}
                            </td>
                            <td className="px-6 py-4 text-sm text-[#526259]">
                              {product.brand || "—"}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-bold text-[#24352B]">
                              {number(product.units_sold)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-extrabold text-[#15803D]">
                              {currency(product.revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="divide-y divide-[#EDF1EE] md:hidden">
                    {filteredTopProducts.map((product, index) => (
                      <article
                        key={product.id ?? `${product.name}-${index}`}
                        className="flex items-start gap-3 p-4"
                      >
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${
                          index === 0
                            ? "bg-[#153D30] text-white"
                            : "bg-[#EAF3ED] text-[#205541]"
                        }`}>
                          #{index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="break-words text-sm font-bold text-[#24352B]">
                            {product.name || "Unnamed product"}
                          </h3>
                          <p className="mt-1 text-xs text-[#8A958E]">
                            {[product.category, product.brand].filter(Boolean).join(" · ") || "No category or brand"}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <span className="text-xs text-[#526259]">
                              {number(product.units_sold)} units sold
                            </span>
                            <span className="font-extrabold text-[#15803D]">
                              {currency(product.revenue)}
                            </span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}

              {!topProductsLoading && !topProductsError && filteredTopProducts.length > 0 && (
                <div className="border-t border-[#EDF1EE] bg-[#FAFCFA] px-5 py-3 text-xs text-[#8A958E] sm:px-6">
                  Showing {filteredTopProducts.length} of {topProducts.length} returned products.
                </div>
              )}
            </Panel>
          </section>

          {/* Footer */}
          <footer className="mt-8 flex flex-col gap-2 border-t border-[#E2E9E4] py-5 text-xs leading-5 text-[#8A958E] sm:flex-row sm:items-center sm:justify-between">
            <p>SmartCart Admin · Reports & Analytics</p>
            <p>Figures depend on the data returned by your backend endpoints.</p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Reports;
