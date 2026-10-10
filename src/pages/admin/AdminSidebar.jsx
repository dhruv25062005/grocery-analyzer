import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Receipt,
  CreditCard,
  BarChart3,
  LogOut,
  ArrowLeft
} from "lucide-react";
import { adminLogout } from "../../services/authService";

const navItems = [
  {
    path: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    path: "/admin/products",
    label: "Products",
    icon: ShoppingBag,
  },
  {
    path: "/admin/inventory",
    label: "Inventory",
    icon: Package,
  },
  {
    path: "/admin/orders",
    label: "Orders",
    icon: Receipt,
  },
  {
    path: "/admin/payments",
    label: "Payments",
    icon: CreditCard,
  },
  {
    path: "/admin/reports",
    label: "Reports",
    icon: BarChart3,
  },
];

const AdminSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    adminLogout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <>
      {/* =========================================================
          MOBILE TOP HORIZONTAL SUB-NAV (Visible on mobile/tablet)
      ========================================================== */}
      <div className="w-full border-b border-slate-200 bg-white px-3 py-2.5 lg:hidden sticky top-[58px] z-30 shadow-xs">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Customer Store</span>
            </button>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-bold text-emerald-700">Admin Console</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 p-1"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>

        {/* Horizontal Navigation Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin"}
                className={({ isActive }) =>
                  `flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition active:scale-95 ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`
                }
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* =========================================================
          DESKTOP SIDEBAR (Visible on lg screens)
      ========================================================== */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="sticky top-[58px] flex h-[calc(100vh-58px)] flex-col justify-between">
          <div className="p-4 space-y-4">
            <div className="px-3 pt-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Supermarket Management
              </p>
            </div>

            {/* Nav links */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/admin"}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Bottom Actions */}
          <div className="border-t border-slate-100 p-4 space-y-2">
            <button
              onClick={() => navigate("/")}
              className="flex min-h-[40px] w-full items-center gap-2.5 rounded-xl px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Storefront</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex min-h-[40px] w-full items-center gap-2.5 rounded-xl px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;