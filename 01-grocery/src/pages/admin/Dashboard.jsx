import { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { apiRequest } from "../../services/api";

const INITIAL_STATS = {
  total_products: 0,
  today_orders: 0,
  today_revenue: 0,
  low_stock: 0,
};

const quickActions = [
  {
    title: "Manage products",
    description: "View and update your product catalogue.",
    path: "/admin/products",
    color: "bg-emerald-50 text-emerald-700",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
      </svg>
    ),
  },
  {
    title: "Check inventory",
    description: "Monitor available stock and shortages.",
    path: "/admin/inventory",
    color: "bg-amber-50 text-amber-700",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3 3 8l9 5 9-5-9-5Z" />
        <path d="M3 8v8l9 5 9-5V8M12 13v8" />
      </svg>
    ),
  },
  {
    title: "Review orders",
    description: "Open customer order records.",
    path: "/admin/orders",
    color: "bg-blue-50 text-blue-700",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M15 3v5h4M9 12h6M9 16h6" />
      </svg>
    ),
  },
  {
    title: "View reports",
    description: "Explore available business reports.",
    path: "/admin/reports",
    color: "bg-violet-50 text-violet-700",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 3v18h18" />
        <path d="m7 14 4-4 4 3 6-7" />
      </svg>
    ),
  },
];

const statCards = [
  {
    key: "total_products",
    label: "Total products",
    description: "Products in your catalogue",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
      </svg>
    ),
    iconStyle: "bg-emerald-50 text-emerald-700",
    valueStyle: "text-[#153D30]",
  },
  {
    key: "today_orders",
    label: "Today's orders",
    description: "Orders created today",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M15 3v5h4M9 12h6M9 16h6" />
      </svg>
    ),
    iconStyle: "bg-blue-50 text-blue-700",
    valueStyle: "text-slate-900",
  },
  {
    key: "today_revenue",
    label: "Today's revenue",
    description: "Revenue from paid orders",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
        <path d="M3 10h18M7 15h3" />
      </svg>
    ),
    iconStyle: "bg-lime-50 text-lime-800",
    valueStyle: "text-emerald-700",
  },
  {
    key: "low_stock",
    label: "Low stock",
    description: "Products needing attention",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3 2.8 19h18.4L12 3Z" />
        <path d="M12 9v4m0 3h.01" />
      </svg>
    ),
    iconStyle: "bg-orange-50 text-orange-700",
    valueStyle: "text-orange-600",
  },
];

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN");

const Dashboard = () => {
  const [stats, setStats] = useState(INITIAL_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/admin/dashboard");

      if (!data?.stats) {
        throw new Error("Dashboard statistics were not returned by the server.");
      }

      setStats({
        ...INITIAL_STATS,
        ...data.stats,
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
      setError(err.message || "Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  const currentDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="flex min-h-[calc(100vh-73px)] bg-[#F5F8F6]">
      <AdminSidebar />

      <main className="min-w-0 flex-1 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <div className="mx-auto max-w-7xl">
          {/* Dashboard header */}
          <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                  SmartCart administration
                </p>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-[#17231F] sm:text-4xl">
                Dashboard
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
                Your store overview, all in one place.
              </p>

              <p className="mt-2 text-xs font-medium text-slate-400">
                {currentDate}
              </p>
            </div>

            <button
              type="button"
              onClick={loadDashboardStats}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#153D30] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#205541] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-wait disabled:opacity-60 sm:self-auto"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                aria-hidden="true"
              >
                <path
                  d="M20 7v5h-5M4 17v-5h5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              {loading ? "Refreshing..." : "Refresh data"}
            </button>
          </header>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-red-600">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                    <path
                      d="M12 8v5m0 3h.01"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-red-800">
                    Unable to load dashboard
                  </p>
                  <p className="mt-1 text-sm leading-5 text-red-700">
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={loadDashboardStats}
                disabled={loading}
                className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
              >
                Try again
              </button>
            </div>
          )}

          {/* Statistics section */}
          <section aria-labelledby="statistics-heading">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2
                  id="statistics-heading"
                  className="text-lg font-bold text-[#17231F]"
                >
                  Store performance
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Key statistics from your dashboard API
                </p>
              </div>

              {lastUpdated && !loading && (
                <p className="hidden text-xs text-slate-400 sm:block">
                  Updated{" "}
                  {lastUpdated.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((card) => (
                <article
                  key={card.key}
                  className="group relative overflow-hidden rounded-2xl border border-[#E2E9E4] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg sm:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-slate-500">
                      {card.label}
                    </p>

                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconStyle} [&>svg]:h-5 [&>svg]:w-5 [&>svg]:stroke-current [&>svg]:stroke-[1.7] [&>svg]:stroke-linecap-round [&>svg]:stroke-linejoin-round`}
                    >
                      {card.icon}
                    </span>
                  </div>

                  {loading ? (
                    <div className="mt-5 h-9 w-28 animate-pulse rounded-lg bg-slate-100" />
                  ) : (
                    <p
                      className={`mt-5 break-words text-3xl font-bold tracking-tight ${card.valueStyle}`}
                    >
                      {card.key === "today_revenue"
                        ? formatCurrency(stats[card.key])
                        : formatNumber(stats[card.key])}
                    </p>
                  )}

                  <p className="mt-3 text-xs leading-5 text-slate-400">
                    {card.description}
                  </p>

                  {card.key === "low_stock" &&
                    !loading &&
                    Number(stats.low_stock) > 0 && (
                      <NavLink
                        to="/admin/inventory"
                        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-orange-700 hover:text-orange-800"
                      >
                        Review inventory
                        <span aria-hidden="true">→</span>
                      </NavLink>
                    )}

                  <div className="pointer-events-none absolute -bottom-10 -right-8 h-24 w-24 rounded-full bg-emerald-50/70 opacity-0 transition duration-300 group-hover:opacity-100" />
                </article>
              ))}
            </div>
          </section>

          {/* Low stock alert */}
          {!loading && !error && Number(stats.low_stock) > 0 && (
            <section className="mt-7 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-6 w-6"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 3 2.8 19h18.4L12 3Z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 9v4m0 3h.01"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>

                <div>
                  <h2 className="font-bold text-amber-950">
                    Inventory needs attention
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    {formatNumber(stats.low_stock)}{" "}
                    {Number(stats.low_stock) === 1
                      ? "product has"
                      : "products have"}{" "}
                    been flagged as low stock. Review your inventory to check
                    availability.
                  </p>
                </div>
              </div>

              <NavLink
                to="/admin/inventory"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-950"
              >
                View inventory
                <span aria-hidden="true">→</span>
              </NavLink>
            </section>
          )}

          {/* Quick actions */}
          <section className="mt-9" aria-labelledby="quick-actions-heading">
            <div className="mb-4">
              <h2
                id="quick-actions-heading"
                className="text-lg font-bold text-[#17231F]"
              >
                Quick actions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Jump directly to a store management section.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((action) => (
                <NavLink
                  key={action.path}
                  to={action.path}
                  className="group flex items-start gap-3 rounded-2xl border border-[#E2E9E4] bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${action.color} [&>svg]:h-5 [&>svg]:w-5 [&>svg]:stroke-current [&>svg]:stroke-[1.7] [&>svg]:stroke-linecap-round [&>svg]:stroke-linejoin-round`}
                  >
                    {action.icon}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-slate-800">
                      {action.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      {action.description}
                    </span>
                  </span>

                  <span className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-700">
                    →
                  </span>
                </NavLink>
              ))}
            </div>
          </section>

          {/* Welcome banner */}
          <section className="relative mt-9 overflow-hidden rounded-2xl bg-[#153D30] p-6 text-white shadow-sm sm:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-28 right-24 h-56 w-56 rounded-full bg-emerald-400/10 blur-2xl"
            />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D9F99D]">
                  Your store, simplified
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                  Welcome to SmartCart
                </h2>
                <p className="mt-3 text-sm leading-6 text-emerald-50/75">
                  Manage your product catalogue, monitor stock levels, review
                  customer orders, and keep track of payment records from your
                  administration workspace.
                </p>
              </div>

              <NavLink
                to="/admin/orders"
                className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-[#D9F99D] px-5 py-3 text-sm font-bold text-[#153D30] transition hover:bg-lime-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 sm:self-center"
              >
                Explore orders
                <span aria-hidden="true">→</span>
              </NavLink>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-8 flex flex-col gap-2 border-t border-[#E2E9E4] pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>SmartCart Admin Workspace</p>
            <p>
              {lastUpdated && !loading
                ? `Last refreshed at ${lastUpdated.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Store overview and management"}
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;