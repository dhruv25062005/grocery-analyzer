import { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import { apiRequest } from "../../services/api";

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_products: 0,
    today_orders: 0,
    today_revenue: 0,
    low_stock: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/admin/dashboard");

      setStats(data.stats);
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);

      setError(
        err.message || "Failed to load dashboard statistics"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="flex min-h-[calc(100vh-73px)] bg-slate-50">

      <AdminSidebar />

      <main className="min-w-0 flex-1 px-6 py-10">

        <div className="mx-auto max-w-7xl">

          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-green-600">
                Admin Panel
              </p>

              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                Dashboard
              </h1>

              <p className="mt-2 text-slate-500">
                Monitor SmartCart sales, inventory and orders.
              </p>
            </div>

            <button
              onClick={loadDashboardStats}
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

          {/* Statistics */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

            {/* Total Products */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <p className="text-sm text-slate-500">
                Total Products
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {loading ? "..." : stats.total_products}
              </h2>

              <p className="mt-2 text-xs text-slate-400">
                Products in inventory
              </p>

            </div>

            {/* Today's Orders */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <p className="text-sm text-slate-500">
                Today's Orders
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {loading ? "..." : stats.today_orders}
              </h2>

              <p className="mt-2 text-xs text-slate-400">
                Orders created today
              </p>

            </div>

            {/* Today's Revenue */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <p className="text-sm text-slate-500">
                Today's Revenue
              </p>

              <h2 className="mt-2 text-3xl font-bold text-green-600">
                {loading
                  ? "..."
                  : formatCurrency(stats.today_revenue)}
              </h2>

              <p className="mt-2 text-xs text-slate-400">
                Revenue from paid orders today
              </p>

            </div>

            {/* Low Stock */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <p className="text-sm text-slate-500">
                Low Stock
              </p>

              <h2 className="mt-2 text-3xl font-bold text-orange-500">
                {loading ? "..." : stats.low_stock}
              </h2>

              <p className="mt-2 text-xs text-slate-400">
                Products need attention
              </p>

            </div>

          </div>

          {/* Welcome */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              SmartCart Administration
            </h2>

            <p className="mt-2 max-w-2xl text-slate-500">
              Manage products, monitor inventory, review customer
              orders and track payments from one place.
            </p>

          </div>

        </div>

      </main>

    </div>
  );
};

export default Dashboard;