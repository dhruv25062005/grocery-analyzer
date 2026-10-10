import { useCart } from "../context/CartContext";
import { useLocation, useNavigate } from "react-router-dom";

const Navbar = () => {
  const { totalItems, totalAmount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminPage = location.pathname.startsWith("/admin");
  const isCartPage = location.pathname === "/checkout";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[64px] max-w-7xl items-center justify-between px-4 sm:px-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 rounded-xl text-left"
            aria-label="SmartCart home"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-600 text-xl text-white shadow-md shadow-green-600/20">
              🛒
            </div>

            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
                SmartCart
              </h1>
              <p className="text-[11px] font-medium text-slate-500">
                Smart grocery checkout
              </p>
            </div>
          </button>

          {!isAdminPage && (
            <button
              onClick={() => navigate("/checkout")}
              className="relative flex min-h-11 items-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition active:scale-95"
            >
              <span>🛍️</span>
              <span className="hidden sm:inline">Cart</span>
              <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs">
                {totalItems}
              </span>
            </button>
          )}
        </div>
      </header>

      {!isAdminPage && (
        <>
          <div className="h-20 sm:hidden" />

          <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-3 pt-2 backdrop-blur-xl pb-[max(8px,env(safe-area-inset-bottom))] sm:hidden">
            <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
              <button
                onClick={() => navigate("/")}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold transition ${
                  !isCartPage
                    ? "bg-green-50 text-green-700"
                    : "text-slate-500 active:bg-slate-100"
                }`}
              >
                <span className="text-xl">⌗</span>
                <span>Scan</span>
              </button>

              <button
                onClick={() => navigate("/checkout")}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold transition ${
                  isCartPage
                    ? "bg-green-50 text-green-700"
                    : "text-slate-500 active:bg-slate-100"
                }`}
              >
                <span className="text-xl">🛒</span>
                <span>
                  Cart{totalItems > 0 ? ` (${totalItems})` : ""}
                </span>
              </button>
            </div>
          </nav>
        </>
      )}
    </>
  );
};

export default Navbar;
