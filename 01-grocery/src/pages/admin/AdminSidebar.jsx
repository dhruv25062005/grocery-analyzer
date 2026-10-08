import { NavLink, useNavigate } from "react-router-dom";
import { adminLogout } from "../../services/authService";

const AdminSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    adminLogout();
    navigate("/admin/login", { replace: true });
  };

  const navItems = [
    {
      path: "/admin",
      label: "Dashboard",
      icon: "📊",
    },
    {
      path: "/admin/products",
      label: "Products",
      icon: "🛍️",
    },
    {
      path: "/admin/inventory",
      label: "Inventory",
      icon: "📦",
    },
    {
      path: "/admin/orders",
      label: "Orders",
      icon: "🧾",
    },
    {
      path: "/admin/payments",
      label: "Payments",
      icon: "💳",
    },
    {
      path: "/admin/reports",
      label: "Reports",
      icon: "📈",
    },
  ];

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="sticky top-0 flex h-[calc(100vh-73px)] flex-col">
        {/* Sidebar Header */}
        <div className="px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Administration
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4">
          <div className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-green-50 text-green-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Logout */}
        <div className="border-t border-slate-200 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <span className="text-lg">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;