import { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import { apiRequest } from "../../services/api";

const Reports = () => {
  const [summary, setSummary] = useState({
    total_orders: 0,
    total_paid_payments: 0,
    total_revenue: 0,
    pending_payments: 0,
    total_products: 0,
    low_stock_products: 0,
  });

  const [dailySales, setDailySales] = useState([]);

  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);
  const [error, setError] = useState("");
  const [salesError, setSalesError] = useState("");
  const [topProducts, setTopProducts] = useState([]);
  const [topProductsLoading, setTopProductsLoading] = useState(true);

  const loadReports = async () => {
  try {
    setLoading(true);
    setSalesLoading(true);
    setTopProductsLoading(true);

    setError("");
    setSalesError("");

    const [summaryData, salesData, topProductsData] = await Promise.all([
      apiRequest("/admin/reports"),
      apiRequest("/admin/reports/daily-sales"),
      apiRequest("/admin/reports/top-products"),
    ]);

    setSummary(summaryData.summary);
    setDailySales(salesData.sales || []);
    setTopProducts(topProductsData.products || []);
  } catch (err) {
    console.error("Failed to load reports:", err);
    setError(err.message || "Failed to load report data");
  } finally {
    setLoading(false);
    setSalesLoading(false);
    setTopProductsLoading(false);
  }
};

  useEffect(() => {
    loadReports();
  }, []);

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100dvh-58px)] bg-slate-50">

      <AdminSidebar />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:p-8">

        <div className="mx-auto max-w-7xl">

          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-green-600">
                Admin Panel
              </p>

              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                Reports
              </h1>

              <p className="mt-2 text-slate-500">
                View SmartCart sales, payments and inventory statistics.
              </p>
            </div>

            <button
              onClick={loadReports}
              disabled={loading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>

          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Main Statistics */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

            {/* Total Orders */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">
                Total Orders
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {loading ? "..." : summary.total_orders}
              </h2>

              <p className="mt-2 text-xs text-slate-400">
                All orders created
              </p>
            </div>

            {/* Paid Payments */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">
                Paid Payments
              </p>

              <h2 className="mt-2 text-3xl font-bold text-green-600">
                {loading ? "..." : summary.total_paid_payments}
              </h2>

              <p className="mt-2 text-xs text-slate-400">
                Successfully completed payments
              </p>
            </div>

            {/* Revenue */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">
                Total Revenue
              </p>

              <h2 className="mt-2 text-3xl font-bold text-green-600">
                {loading
                  ? "..."
                  : formatCurrency(summary.total_revenue)}
              </h2>

              <p className="mt-2 text-xs text-slate-400">
                Revenue from paid payments
              </p>
            </div>

            {/* Pending Payments */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">
                Pending Payments
              </p>

              <h2 className="mt-2 text-3xl font-bold text-yellow-600">
                {loading ? "..." : summary.pending_payments}
              </h2>

              <p className="mt-2 text-xs text-slate-400">
                Payments awaiting completion
              </p>
            </div>

            {/* Products */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">
                Active Products
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {loading ? "..." : summary.total_products}
              </h2>

              <p className="mt-2 text-xs text-slate-400">
                Products currently available
              </p>
            </div>

            {/* Low Stock */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">
                Low Stock Products
              </p>

              <h2 className="mt-2 text-3xl font-bold text-orange-500">
                {loading ? "..." : summary.low_stock_products}
              </h2>

              <p className="mt-2 text-xs text-slate-400">
                Products with stock of 10 or less
              </p>
            </div>

          </div>

          {/* Sales Overview */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Sales Overview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Daily paid orders and revenue.
                </p>
              </div>

              <div className="rounded-lg bg-green-50 px-4 py-2">
                <p className="text-xs font-medium text-green-600">
                  Total Revenue
                </p>

                <p className="text-lg font-bold text-green-700">
                  {formatCurrency(summary.total_revenue)}
                </p>
              </div>

            </div>

            {/* Sales Chart */}
            <div className="mt-8">

              {salesLoading ? (
                <div className="flex h-80 items-center justify-center rounded-xl bg-slate-50">
                  <p className="text-slate-500">
                    Loading sales data...
                  </p>
                </div>
              ) : salesError ? (
                <div className="flex h-80 items-center justify-center rounded-xl bg-red-50">
                  <p className="text-red-600">
                    {salesError}
                  </p>
                </div>
              ) : dailySales.length === 0 ? (
                <div className="flex h-80 items-center justify-center rounded-xl bg-slate-50">
                  <p className="text-slate-500">
                    No paid sales data available yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="min-w-[700px]">

                    {/* Chart */}
                    <div className="relative h-80 rounded-xl bg-slate-50 p-6">

                      <div className="flex h-full items-end gap-4">

                        {dailySales.map((day) => {
                          const maxRevenue = Math.max(
                            ...dailySales.map((item) =>
                              Number(item.revenue)
                            )
                          );

                          const revenue = Number(day.revenue);

                          const height =
                            maxRevenue > 0
                              ? Math.max(
                                  (revenue / maxRevenue) * 100,
                                  5
                                )
                              : 5;

                          return (
                            <div
                              key={day.date}
                              className="group flex h-full min-w-[80px] flex-1 flex-col justify-end"
                            >

                              {/* Revenue label */}
                              <div className="mb-2 text-center opacity-0 transition group-hover:opacity-100">
                                <p className="text-xs font-semibold text-slate-700">
                                  {formatCurrency(revenue)}
                                </p>

                                <p className="text-xs text-slate-400">
                                  {day.orders}{" "}
                                  {Number(day.orders) === 1
                                    ? "order"
                                    : "orders"}
                                </p>
                              </div>

                              {/* Bar */}
                              <div
                                className="w-full rounded-t-xl bg-green-500 transition-all duration-300 group-hover:bg-green-600"
                                style={{
                                  height: `${height}%`,
                                }}
                              />

                              {/* Date */}
                              <div className="mt-3 text-center">
                                <p className="text-xs font-medium text-slate-600">
                                  {formatDate(day.date)}
                                </p>
                              </div>

                            </div>
                          );
                        })}

                      </div>

                    </div>

                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Top Selling Products */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Top Selling Products
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Best performing products based on paid orders
              </p>
            </div>

            {topProductsLoading ? (
              <div className="flex h-40 items-center justify-center">
                <p className="text-sm text-slate-500">
                  Loading top products...
                </p>
              </div>
            ) : topProducts.length === 0 ? (
              <div className="flex h-40 items-center justify-center">
                <p className="text-sm text-slate-500">
                  No sales data available yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-left">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        #
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Product
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Category
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Brand
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Units Sold
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Revenue
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {topProducts.map((product, index) => (
                      <tr
                        key={product.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                            {index + 1}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-900">
                            {product.name}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-600">
                          {product.category || "—"}
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-600">
                          {product.brand || "—"}
                        </td>

                        <td className="px-4 py-4 text-right">
                          <span className="font-semibold text-slate-900">
                            {Number(product.units_sold || 0).toLocaleString("en-IN")}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <span className="font-bold text-emerald-600">
                            {formatCurrency(product.revenue)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Report Overview */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              Business Overview
            </h2>

            <p className="mt-2 max-w-3xl text-slate-500">
              This report summarizes SmartCart's current orders,
              payments, revenue and inventory status using live
              PostgreSQL data.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">

              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  Average Revenue per Paid Payment
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {loading
                    ? "..."
                    : formatCurrency(
                        Number(summary.total_paid_payments) > 0
                          ? Number(summary.total_revenue) /
                              Number(summary.total_paid_payments)
                          : 0
                      )}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  Payment Completion Rate
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {loading
                    ? "..."
                    : `${
                        Number(summary.total_paid_payments) +
                          Number(summary.pending_payments) >
                        0
                          ? (
                              (Number(summary.total_paid_payments) /
                                (Number(summary.total_paid_payments) +
                                  Number(summary.pending_payments))) *
                              100
                            ).toFixed(1)
                          : "0.0"
                      }%`}
                </p>
              </div>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
};

export default Reports;