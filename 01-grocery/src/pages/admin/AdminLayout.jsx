// src/pages/admin/AdminLayout.jsx

import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const pageTitles = {
    "/admin": "Dashboard",
    "/admin/products": "Products",
    "/admin/inventory": "Inventory",
    "/admin/orders": "Orders",
    "/admin/payments": "Payments",
    "/admin/reports": "Reports",
  };

  const currentTitle = pageTitles[location.pathname] || "Administration";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Shared Admin Header */}
      <header className="sticky top-0 z-50 flex h-[73px] items-center gap-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
        {/* Menu Button - Always Visible */}
        <button
          type="button"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={isSidebarOpen}
          aria-controls="admin-sidebar"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {isSidebarOpen ? (
            // Close icon
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          ) : (
            // Menu icon
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          )}
        </button>

        {/* Admin Branding */}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
            Admin Panel
          </h1>
          <p className="hidden text-xs text-slate-500 sm:block">
            Manage your store
          </p>
        </div>

        <div className="ml-auto">
          <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 sm:text-sm">
            {currentTitle}
          </span>
        </div>
      </header>

      {/* Sidebar + Current Admin Page */}
      <div className="flex min-h-[calc(100vh-73px)]">
        <div id="admin-sidebar">
          <AdminSidebar isOpen={isSidebarOpen} />
        </div>

        {/* Every admin page renders here */}
        <main className="min-w-0 flex-1 overflow-x-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;