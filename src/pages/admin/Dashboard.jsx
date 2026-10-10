import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Receipt,
  IndianRupee,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  Boxes
} from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import { apiRequest } from "../../services/api";

const Dashboard = () => {
  const navigate = useNavigate();

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
      if (data?.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
      setError(err.message || "Failed to load dashboard statistics");
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
    <div className="flex flex-col lg:flex-row min-h-[calc(100dvh-58px)] bg-slate-50">
      <AdminSidebar />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Supermarket Console
              </p>
              <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Store Overview
              </h1>
              <p className="text-xs text-slate-500">
                Live POS metrics, stock alerts, and customer activity.
              </p>
            </div>

            <button
              onClick={loadDashboardStats}
              disabled={loading}
              className="inline-flex min-h-[40px] items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition disabled:opacity-50"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Updating..." : "Refresh"}</span>
            </button>
          </div>

          {error && (
            <div className="rounded-2xl bg-rose-50 p-4 text-xs text-rose-700 border border-rose-200">
              {error}
            </div>
          )}

          {/* KPI Stat Cards Grid (Mobile 2x2 grid, Desktop 4x1) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {/* Card 1: Total Products */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium text-slate-500">Products</span>
                <Boxes className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums sm:text-3xl">
                {loading ? "..." : stats.total_products}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">Active catalog items</p>
            </div>

            {/* Card 2: Today's Orders */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium text-slate-500">Today Orders</span>
                <Receipt className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums sm:text-3xl">
                {loading ? "..." : stats.today_orders}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">Checkout sessions</p>
            </div>

            {/* Card 3: Today Revenue */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium text-slate-500">Today Revenue</span>
                <IndianRupee className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-extrabold tracking-tight text-emerald-700 tabular-nums sm:text-3xl truncate">
                {loading ? "..." : formatCurrency(stats.today_revenue)}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">Verified payments</p>
            </div>

            {/* Card 4: Low Stock Alert */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium text-slate-500">Low Stock</span>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <p className="mt-2 text-2xl font-extrabold tracking-tight text-amber-600 tabular-nums sm:text-3xl">
                {loading ? "..." : stats.low_stock}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">Items below 10 units</p>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Operations Shortcuts</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => navigate("/admin/inventory")}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left hover:bg-slate-100 transition active:scale-98"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">Manage Inventory</p>
                  <p className="text-[11px] text-slate-500">Restock & update low items</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                onClick={() => navigate("/admin/orders")}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left hover:bg-slate-100 transition active:scale-98"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">View Active Orders</p>
                  <p className="text-[11px] text-slate-500">Check receipts & tokens</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                onClick={() => navigate("/admin/reports")}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left hover:bg-slate-100 transition active:scale-98"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">Sales Reports</p>
                  <p className="text-[11px] text-slate-500">Revenue analytics & top SKUs</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;