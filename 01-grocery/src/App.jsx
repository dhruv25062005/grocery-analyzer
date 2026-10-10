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

function Home() {
  const [product, setProduct] = useState(null);

  const {
    cart,
    addToCart,
    totalItems,
    totalAmount,
  } = useCart();

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
    <main className="min-h-[calc(100vh-73px)] bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* Header */}
        <div className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-green-600">
            Self Checkout
          </p>

          <h1 className="text-4xl font-bold text-slate-900">
            Welcome to SmartCart
          </h1>

          <p className="mt-2 text-slate-500">
            Scan your products and checkout quickly.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid gap-8 lg:grid-cols-3">

          {/* Scanner Section */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
                  📷
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Scan Product
                  </h2>

                  <p className="text-sm text-slate-500">
                    Scan the barcode or enter it manually.
                  </p>
                </div>
              </div>

              <Scanner onProductFound={handleProductFound} />

              {/* Product */}
              {product && (
                <div className="mt-8 border-t border-slate-200 pt-8">
                  <ProductCard
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                </div>
              )}

              {/* Empty Scanner State */}
              {!product && (
                <div className="mt-8 rounded-xl bg-slate-50 p-10 text-center">
                  <div className="mb-3 text-5xl">
                    🛒
                  </div>

                  <h3 className="font-semibold text-slate-700">
                    Ready to scan
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Scan a product barcode to get started.
                  </p>
                </div>
              )}

            </div>
          </div>

          {/* Cart Section */}
          <div>
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              {/* Cart Header */}
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  Cart
                </h2>

                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                  {totalItems} items
                </span>
              </div>

              {/* Empty Cart */}
              {cart.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="text-4xl">
                    🛍️
                  </div>

                  <p className="mt-3 font-medium text-slate-700">
                    Your cart is empty
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Scan products to add them here.
                  </p>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="max-h-[400px] space-y-2 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <CartItem
                        key={item.id}
                        item={item}
                      />
                    ))}
                  </div>

                  {/* Cart Summary */}
                  <div className="mt-6 border-t border-slate-200 pt-5">

                    <div className="flex items-center justify-between text-slate-500">
                      <span>Items</span>
                      <span>{totalItems}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-semibold text-slate-900">
                        Total
                      </span>

                      <span className="text-2xl font-bold text-slate-900">
                        ₹{totalAmount.toFixed(2)}
                      </span>
                    </div>

                  </div>

                  {/* Checkout */}
                  <button
                    onClick={() => navigate("/checkout")}
                    className="mt-6 w-full rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700"
                  >
                    Proceed to Checkout
                  </button>
                </>
              )}

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}

function App() {
  return (
    <>
      <Navbar />

      <Routes>

        {/* ========================= */}
        {/* Customer Routes */}
        {/* ========================= */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/checkout"
          element={<CheckoutPage />}
        />

        <Route
          path="/payment"
          element={<PaymentPage />}
        />

        <Route
          path="/success"
          element={<SuccessPage />}
        />

        {/* ========================= */}
        {/* Public Admin Login */}
        {/* ========================= */}

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        {/* ========================= */}
        {/* Protected Admin Routes */}
        {/* ========================= */}

        <Route element={<AdminProtectedRoute />}>

          <Route
            path="/admin"
            element={<Dashboard />}
          />

          <Route
            path="/admin/products"
            element={<Products />}
          />

          <Route
            path="/admin/inventory"
            element={<Inventory />}
          />

          <Route
            path="/admin/orders"
            element={<Orders />}
          />

          <Route
            path="/admin/orders/:orderId"
            element={<OrderDetails />}
          />

          <Route
            path="/admin/payments"
            element={<Payments />}
          />

          <Route
            path="/admin/reports"
            element={<Reports />}
          />

        </Route>

      </Routes>
    </>
  );
}

export default App;