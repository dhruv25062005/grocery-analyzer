import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useLocation, useNavigate } from "react-router-dom";

const Navbar = () => {
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isHome = location.pathname === "/";
  const isCheckout = location.pathname === "/checkout";

  const goTo = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const navLinkClass = (active) =>
    `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
      active
        ? "bg-emerald-50 text-emerald-800"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <nav
        className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10"
        aria-label="Main navigation"
      >
        <div className="flex h-[76px] items-center justify-between gap-4">

          {/* Brand */}
          <button
            type="button"
            onClick={() => goTo("/")}
            aria-label="SmartCart home"
            className="group flex shrink-0 items-center gap-3 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-4"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#153D30] text-white shadow-md shadow-emerald-950/15 transition duration-300 group-hover:rotate-[-4deg] group-hover:scale-105">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path
                  d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="10" cy="19" r="1.5" fill="#D9F99D" />
                <circle cx="18" cy="19" r="1.5" fill="#D9F99D" />
              </svg>
            </span>

            <span className="min-w-0">
              <span className="block text-[19px] font-extrabold leading-tight tracking-[-0.7px] text-[#153D30] sm:text-xl">
                SmartCart
                <span className="text-emerald-600">.</span>
              </span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[1.7px] text-slate-500 sm:text-[11px]">
                Smart self-checkout
              </span>
            </span>
          </button>

          {/* Desktop navigation */}
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => goTo("/")}
              aria-current={isHome ? "page" : undefined}
              className={navLinkClass(isHome)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-[18px] w-[18px]"
                aria-hidden="true"
              >
                <path
                  d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 8h8v8H8z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
              Scan products
            </button>

            <button
              type="button"
              onClick={() => goTo("/checkout")}
              aria-current={isCheckout ? "page" : undefined}
              className={`group relative inline-flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${
                isCheckout
                  ? "bg-[#153D30] text-white shadow-md shadow-emerald-950/15"
                  : "bg-[#153D30] text-white shadow-sm shadow-emerald-950/10 hover:bg-[#205541] hover:shadow-md"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-[19px] w-[19px]"
                aria-hidden="true"
              >
                <path
                  d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="10" cy="19" r="1.5" fill="currentColor" />
                <circle cx="18" cy="19" r="1.5" fill="currentColor" />
              </svg>

              Cart

              <span
                className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-extrabold tabular-nums ${
                  totalItems > 0
                    ? "bg-[#D9F99D] text-[#153D30]"
                    : "bg-white/15 text-white"
                }`}
                aria-label={`${totalItems} items in cart`}
              >
                {totalItems}
              </span>
            </button>
          </div>

          {/* Mobile cart and menu */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              type="button"
              onClick={() => goTo("/checkout")}
              aria-label={`Open cart, ${totalItems} items`}
              className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-[#153D30] text-white transition hover:bg-[#205541] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="10" cy="19" r="1.5" fill="currentColor" />
                <circle cx="18" cy="19" r="1.5" fill="currentColor" />
              </svg>

              {totalItems > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D9F99D] px-1 text-[10px] font-extrabold text-[#153D30] ring-2 ring-white">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              aria-controls="smartcart-mobile-menu"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              {menuOpen ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="m6 6 12 12M18 6 6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="M4 7h16M4 12h16M4 17h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <div
          id="smartcart-mobile-menu"
          className={`grid transition-[grid-template-rows,opacity,padding] duration-200 sm:hidden ${
            menuOpen
              ? "grid-rows-[1fr] pb-4 opacity-100"
              : "grid-rows-[0fr] pb-0 opacity-0"
          }`}
          aria-hidden={!menuOpen}
          inert={!menuOpen}
        >
          <div className="overflow-hidden">
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-2">
              <button
                type="button"
                onClick={() => goTo("/")}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                  isHome
                    ? "bg-emerald-100 text-emerald-900"
                    : "text-slate-700 hover:bg-white"
                }`}
              >
                <span aria-hidden="true">⌗</span>
                Scan products
                {isHome && (
                  <span className="ml-auto text-xs font-bold">CURRENT</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => goTo("/checkout")}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                  isCheckout
                    ? "bg-emerald-100 text-emerald-900"
                    : "text-slate-700 hover:bg-white"
                }`}
              >
                <span aria-hidden="true">🛒</span>
                View cart
                <span className="ml-auto rounded-full bg-[#153D30] px-2.5 py-1 text-xs font-bold text-white">
                  {totalItems}
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
