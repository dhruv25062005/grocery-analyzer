import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { totalItems } = useCart();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-600 text-xl font-bold text-white shadow-md">
            S
          </div>

          <div className="text-left">
            <h1 className="text-xl font-bold text-slate-900">
              SmartCart
            </h1>
            <p className="text-xs text-slate-500">
              Self Checkout
            </p>
          </div>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-3">

          <button
            onClick={() => navigate("/")}
            className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 sm:block"
          >
            Scan Products
          </button>

          <button
            onClick={() => navigate("/checkout")}
            className="relative flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <span>🛒</span>
            <span>Cart</span>

            {totalItems > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1.5 text-xs font-bold text-white">
                {totalItems}
              </span>
            )}
          </button>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;