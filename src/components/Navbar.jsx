import { useCart } from "../context/CartContext";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { QrCode, ShoppingBag, Store, ShieldCheck } from "lucide-react";
import { PWAInstallButton } from "./PWAInstallButton";
import storeLogo from "../assets/images/grocery_store_avatar_1791627547585.jpg";

const Navbar = () => {
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isAdminPage = location.pathname.startsWith("/admin");
  const isCartPage = location.pathname === "/checkout";
  const isPaymentPage = location.pathname === "/payment";
  const isSuccessPage = location.pathname === "/success";
  const isHome = location.pathname === "/";

  const currentTab = searchParams.get("tab") || "scan";
  const isScanActive = isHome && currentTab === "scan";
  const isAisleActive = isHome && currentTab === "catalog";

  return (
    <>
      {/* =========================================================
          TOP MOBILE & DESKTOP APP BAR
      ========================================================== */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-[58px] max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Brand & Store Details */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 text-left focus:outline-none"
            aria-label="SmartCart home"
          >
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-50 shadow-sm">
              <img
                src={storeLogo}
                alt="SmartCart"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-slate-900">
                  SmartCart
                </span>
                <span className="hidden rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 sm:inline-block">
                  EXPRESS
                </span>
              </div>
              <p className="truncate text-[11px] font-medium text-slate-500">
                Aisle 4 · Self-Checkout
              </p>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <button
              onClick={() => navigate("/?tab=scan")}
              className={`hover:text-emerald-700 transition ${isScanActive ? "text-emerald-700 font-bold" : ""}`}
            >
              Scan & Go
            </button>
            <button
              onClick={() => navigate("/?tab=catalog")}
              className={`hover:text-emerald-700 transition ${isAisleActive ? "text-emerald-700 font-bold" : ""}`}
            >
              Browse Aisle
            </button>
            <button
              onClick={() => navigate("/checkout")}
              className={`hover:text-emerald-700 transition ${isCartPage ? "text-emerald-700 font-bold" : ""}`}
            >
              Cart & Bill
            </button>
          </nav>

          {/* Right Action: Install PWA, Cart Indicator & Admin Portal */}
          <div className="flex items-center gap-2">
            <PWAInstallButton />

            {!isAdminPage && (
              <button
                onClick={() => navigate("/checkout")}
                className={`relative flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition active:scale-95 ${
                  isCartPage
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                aria-label={`View Cart, ${totalItems} items`}
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">Cart</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                    isCartPage
                      ? "bg-white text-emerald-800"
                      : "bg-emerald-600 text-white"
                  }`}
                >
                  {totalItems}
                </span>
              </button>
            )}

            {/* Admin Hub Switcher */}
            <button
              onClick={() => navigate(isAdminPage ? "/" : "/admin")}
              className={`flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition active:scale-95 ${
                isAdminPage
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
              title={isAdminPage ? "Back to Customer App" : "Store Admin Portal"}
            >
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="hidden sm:inline">
                {isAdminPage ? "Storefront" : "Admin"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================
          BOTTOM NATIVE TAB NAVIGATION BAR (Mobile & Touch Devices)
      ========================================================== */}
      {!isCartPage && !isPaymentPage && !isSuccessPage && !isAdminPage && (
        <nav
          aria-label="Mobile Bottom Navigation"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/95 px-3 pt-1 backdrop-blur-xl pb-[max(0.6rem,env(safe-area-inset-bottom))] md:hidden"
        >
          <div className="mx-auto grid max-w-md grid-cols-4 items-center gap-1">
          {/* Tab 1: Scan & Go */}
          <button
            onClick={() => navigate("/?tab=scan")}
            className={`flex min-h-[48px] flex-col items-center justify-center rounded-xl py-1 text-[11px] font-medium transition active:scale-95 ${
              isScanActive
                ? "font-bold text-emerald-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${isScanActive ? "text-emerald-600 scale-105" : ""}`}>
              <QrCode className="h-5 w-5" />
            </div>
            <span className="tracking-tight mt-0.5">Scan</span>
          </button>

          {/* Tab 2: Catalog / Aisle */}
          <button
            onClick={() => navigate("/?tab=catalog")}
            className={`flex min-h-[48px] flex-col items-center justify-center rounded-xl py-1 text-[11px] font-medium transition active:scale-95 ${
              isAisleActive
                ? "font-bold text-emerald-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${isAisleActive ? "text-emerald-600 scale-105" : ""}`}>
              <Store className="h-5 w-5" />
            </div>
            <span className="tracking-tight mt-0.5">Aisle</span>
          </button>

          {/* Tab 3: Cart */}
          <button
            onClick={() => navigate("/checkout")}
            className={`relative flex min-h-[48px] flex-col items-center justify-center rounded-xl py-1 text-[11px] font-medium transition active:scale-95 ${
              isCartPage || isPaymentPage || isSuccessPage
                ? "font-bold text-emerald-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <div className="relative flex h-6 w-6 items-center justify-center rounded-lg">
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[9px] font-bold text-white shadow-xs">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="tracking-tight mt-0.5">Cart</span>
          </button>

          {/* Tab 4: Admin */}
          <button
            onClick={() => navigate(isAdminPage ? "/admin" : "/admin/login")}
            className={`flex min-h-[48px] flex-col items-center justify-center rounded-xl py-1 text-[11px] font-medium transition active:scale-95 ${
              isAdminPage
                ? "font-bold text-emerald-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="tracking-tight mt-0.5">Admin</span>
          </button>
        </div>
      </nav>
      )}
    </>
  );
};

export default Navbar;
