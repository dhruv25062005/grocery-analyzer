// src/pages/admin/AdminSidebar.jsx

import { NavLink, useNavigate } from "react-router-dom";
import { adminLogout } from "../../services/authService";

const AdminSidebar = ({ isOpen }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    adminLogout();
    navigate("/admin/login", { replace: true });
  };

  const navItems = [
    { path: "/admin", label: "Dashboard", icon: "📊" },
    { path: "/admin/products", label: "Products", icon: "🛍️" },
    { path: "/admin/inventory", label: "Inventory", icon: "📦" },
    { path: "/admin/orders", label: "Orders", icon: "🧾" },
    { path: "/admin/payments", label: "Payments", icon: "💳" },
    { path: "/admin/reports", label: "Reports", icon: "📈" },
  ];

  return (
    <aside
      aria-label="Admin sidebar"
      aria-hidden={!isOpen}
      className={`${
        isOpen ? "w-64 border-r" : "w-0 border-r-0"
      } shrink-0 overflow-hidden border-slate-200 bg-white transition-all duration-300 ease-in-out`}
    >
      <div
        className={`sticky top-0 flex h-[calc(100vh-73px)] w-64 flex-col ${
          isOpen ? "opacity-100" : "opacity-0"
        } transition-opacity duration-200`}
      >
        {/* Sidebar Header */}
        <div className="px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Administration
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4">
          <div className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin"}
                tabIndex={isOpen ? 0 : -1}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-green-50 text-green-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                <span className="text-lg" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Logout */}
        <div className="border-t border-slate-200 p-4">
          <button
            onClick={handleLogout}
            tabIndex={isOpen ? 0 : -1}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <span className="text-lg" aria-hidden="true">
              🚪
            </span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;