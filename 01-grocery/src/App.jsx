
import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import Scanner from "./components/Scanner";
import ProductCard from "./components/ProductCard";
import CartItem from "./components/CartItem";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

import CheckoutPage from "./pages/CheckoutPage";
import PaymentPage from "./pages/PaymentPage";
import SuccessPage from "./pages/SuccessPage";

import { useCart } from "./context/CartContext";
import Navbar from "./components/Navbar";

import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Inventory from "./pages/admin/Inventory";
import Orders from "./pages/admin/Orders";
import OrderDetails from "./pages/admin/OrderDetails";
import Payments from "./pages/admin/Payments";
import Reports from "./pages/admin/Reports";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";


function Home() {
  const [product, setProduct] = useState(null);

  const { cart, addToCart, totalItems, totalAmount } = useCart();

  const navigate = useNavigate();

  const handleProductFound = (foundProduct) => {
    setProduct(foundProduct);

    if (Number(foundProduct.stock) > 0) {
      addToCart(foundProduct);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  return (
    <main className="relative min-h-[calc(100vh-73px)] overflow-hidden bg-[#f5f8f6] text-slate-900">

      {/* Background decoration */}
      <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-[450px] h-72 w-72 rounded-full bg-teal-100/40 blur-3xl" />

      <div className="relative mx-auto max-w-[1440px] px-4 py-7 sm:px-6 lg:px-10 lg:py-10">

        {/* Welcome banner */}
        <section className="relative mb-8 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#102d25] via-[#14513d] to-[#087f5b] p-7 text-white shadow-xl shadow-emerald-950/10 sm:p-10 lg:p-12">

          <div className="pointer-events-none absolute -right-10 -top-20 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-2 -top-12 h-56 w-56 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-28 right-40 h-64 w-64 rounded-full bg-emerald-300/10 blur-2xl" />

          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">

            <div className="max-w-2xl">

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold tracking-wide text-emerald-50 backdrop-blur-md">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                SMART SELF-CHECKOUT
              </div>

              <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Shopping made
                <span className="block text-emerald-300">
                  simple & smarter.
                </span>
              </h1>

              <p className="mt-4 max-w-lg text-sm leading-7 text-emerald-50/80 sm:text-base">
                Scan your products, track your cart in real time, and finish
                checkout without waiting in long queues.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3 text-sm text-emerald-50/90">
                <span className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                  <span>⚡</span> Quick checkout
                </span>

                <span className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                  <span>✓</span> Live cart updates
                </span>
              </div>
            </div>

            <div className="hidden shrink-0 items-center justify-center md:flex">
              <div className="flex h-40 w-40 items-center justify-center rounded-[35px] border border-white/20 bg-white/10 text-7xl shadow-2xl backdrop-blur-xl transition duration-500 hover:rotate-6 hover:scale-105 lg:h-48 lg:w-48 lg:text-8xl">
                🛒
              </div>
            </div>

          </div>
        </section>

        {/* Statistics */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-2xl transition group-hover:bg-emerald-100">
              📦
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Items in cart
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight">
                {totalItems}
              </p>
            </div>
          </div>

          <div className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl transition group-hover:bg-blue-100">
              💳
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Current total
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight">
                ₹{Number(totalAmount).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-2xl transition group-hover:bg-amber-100">
              ✨
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                Checkout experience
              </p>
              <p className="mt-1 text-lg font-bold tracking-tight">
                Fast & convenient
              </p>
            </div>
          </div>

        </section>

        {/* Main content */}
        <section className="grid items-start gap-6 lg:grid-cols-12 lg:gap-8">

          {/* Scanner panel */}
          <div className="min-w-0 lg:col-span-8">

            <div className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:shadow-md">

              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-7">

                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">
                    📷
                  </div>

                  <div>
                    <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                      Product scanner
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Add products to your cart instantly.
                    </p>
                  </div>
                </div>

                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Scanner ready
                </div>

              </div>

              <div className="p-5 sm:p-7">

                {/* Existing scanner functionality */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 sm:p-5">
                  <Scanner onProductFound={handleProductFound} />
                </div>

                {/* Product found */}
                {product && (
                  <div className="mt-7 animate-[fadeIn_0.35s_ease-out]">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-sm text-emerald-700">
                        ✓
                      </span>

                      <h3 className="font-bold text-slate-800">
                        Product identified
                      </h3>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-3 sm:p-5">
                      <ProductCard
                        product={product}
                        onAddToCart={handleAddToCart}
                      />
                    </div>
                  </div>
                )}

                {/* Empty scanner state */}
                {!product && (
                  <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-b from-slate-50/80 to-white px-5 py-10 text-center sm:py-14">

                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-5xl shadow-sm ring-1 ring-slate-100">
                      🛍️
                    </div>

                    <h3 className="mt-5 text-lg font-bold text-slate-800">
                      Ready when you are
                    </h3>

                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                      Scan a product barcode or enter it manually to see
                      product details and add it to your cart.
                    </p>

                    <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs font-medium text-slate-500">
                      <span className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                        01 · Scan
                      </span>
                      <span className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                        02 · Review
                      </span>
                      <span className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                        03 · Checkout
                      </span>
                    </div>

                  </div>
                )}

              </div>
            </div>

            {/* Bottom information cards */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">

              <div className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-5">
                <span className="text-2xl">🔒</span>
                <div>
                  <h3 className="font-bold text-slate-800">
                    Secure shopping
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Review your order before continuing to payment.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-5">
                <span className="text-2xl">♻️</span>
                <div>
                  <h3 className="font-bold text-slate-800">
                    Shop efficiently
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Keep track of every item as you shop.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Cart panel */}
          <aside className="min-w-0 lg:col-span-4">
            <div className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-sm lg:sticky lg:top-24">

              {/* Cart heading */}
              <div className="bg-gradient-to-br from-white to-emerald-50/70 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                      Your order
                    </p>
                    <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                      Shopping cart
                    </h2>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-2xl text-white shadow-lg shadow-emerald-600/20">
                    🛒
                  </div>

                </div>

                <div className="mt-5 flex items-center justify-between rounded-xl border border-emerald-100 bg-white/80 px-4 py-3">
                  <span className="text-sm font-medium text-slate-600">
                    Total items
                  </span>

                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">
                    {totalItems}
                  </span>
                </div>

              </div>

              {/* Cart content */}
              {cart.length === 0 ? (
                <div className="px-5 py-10 text-center sm:px-7 sm:py-12">

                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-4xl">
                    🛍️
                  </div>

                  <h3 className="mt-5 font-bold text-slate-800">
                    Nothing here yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-[240px] text-sm leading-6 text-slate-500">
                    Your cart is waiting for its first product. Start scanning
                    to add items.
                  </p>

                  <div className="mx-auto mt-5 max-w-xs rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                    💡 Tip: Scan a product barcode to add it to your order.
                  </div>

                </div>
              ) : (
                <div className="p-5 sm:p-6">

                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">
                      Order items
                    </h3>
                    <span className="text-xs text-slate-400">
                      {cart.length} product{cart.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="max-h-[380px] space-y-3 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-100 bg-white p-2 transition hover:border-emerald-100 hover:bg-emerald-50/20"
                      >
                        <CartItem item={item} />
                      </div>
                    ))}
                  </div>

                  {/* Order summary */}
                  <div className="mt-6 border-t border-dashed border-slate-200 pt-5">

                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>Items subtotal</span>
                      <span className="font-medium text-slate-700">
                        ₹{Number(totalAmount).toFixed(2)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                      <span>Delivery</span>
                      <span className="font-semibold text-emerald-600">
                        Store pickup
                      </span>
                    </div>

                    <div className="my-5 border-t border-slate-100" />

                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          Total amount
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Final amount before payment
                        </p>
                      </div>

                      <p className="text-2xl font-extrabold tracking-tight text-slate-900">
                        ₹{Number(totalAmount).toFixed(2)}
                      </p>
                    </div>

                  </div>

                  {/* Checkout button */}
                  <button
                    onClick={() => navigate("/checkout")}
                    className="group mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-5 py-4 font-bold text-white shadow-lg shadow-emerald-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl active:translate-y-0"
                  >
                    <span>Proceed to checkout</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </button>

                  <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                    <span>🔒</span>
                    Review your order before payment
                  </p>

                </div>
              )}

            </div>
          </aside>

        </section>

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-200/80 py-6 text-center">
          <p className="text-sm font-medium text-slate-500">
            SmartCart
            <span className="mx-2 text-slate-300">|</span>
            A smarter way to shop.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Scan smarter. Shop faster. Checkout easier.
          </p>
        </footer>

      </div>

      {/* Local animation */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

    </main>
  );
}

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        {/* Customer routes */}
        <Route path="/" element={<Home />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/success" element={<SuccessPage />} />

        {/* Public admin login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected admin routes */}
        <Route element={<AdminProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:orderId" element={<OrderDetails />} />
            <Route path="payments" element={<Payments />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
