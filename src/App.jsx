import { useState, useEffect, useMemo } from "react";
import { Routes, Route, useNavigate, useSearchParams } from "react-router-dom";
import {
  QrCode,
  Store,
  ShoppingBag,
  ArrowRight,
  Search,
  Plus,
  Minus,
  Sparkles,
  ChevronRight,
  X
} from "lucide-react";

import Scanner from "./components/Scanner";
import ProductCard from "./components/ProductCard";
import CartItem from "./components/CartItem";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import Navbar from "./components/Navbar";

import CheckoutPage from "./pages/CheckoutPage";
import PaymentPage from "./pages/PaymentPage";
import SuccessPage from "./pages/SuccessPage";

import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Inventory from "./pages/admin/Inventory";
import Orders from "./pages/admin/Orders";
import OrderDetails from "./pages/admin/OrderDetails";
import Payments from "./pages/admin/Payments";
import Reports from "./pages/admin/Reports";
import AdminLogin from "./pages/admin/AdminLogin";

import { useCart } from "./context/CartContext";
import { getAllProducts } from "./services/productService";
import heroBannerImg from "./assets/images/grocery_hero_fresh_1791627527051.jpg";

function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "catalog" ? "catalog" : "scan";

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  const [scannedProduct, setScannedProduct] = useState(null);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { cart, addToCart, updateQuantity, totalItems, totalAmount } = useCart();
  const navigate = useNavigate();

  // Fetch catalog products
  useEffect(() => {
    let mounted = true;
    const fetchCatalog = async () => {
      try {
        setLoadingCatalog(true);
        const res = await getAllProducts();
        if (mounted && res?.products) {
          setCatalogProducts(res.products);
        }
      } catch (err) {
        console.error("Failed to load catalog:", err);
      } finally {
        if (mounted) setLoadingCatalog(false);
      }
    };
    fetchCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  const handleProductFound = (foundProduct) => {
    setScannedProduct(foundProduct);
    if (Number(foundProduct.stock) > 0) {
      addToCart(foundProduct);
    }
  };

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set();
    catalogProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["All", ...Array.from(set).slice(0, 10)];
  }, [catalogProducts]);

  // Filtered products for catalog
  const filteredProducts = useMemo(() => {
    return catalogProducts.filter((p) => {
      const matchesSearch =
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode?.includes(searchQuery);
      const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [catalogProducts, searchQuery, selectedCategory]);

  return (
    <main className="min-h-[calc(100dvh-58px)] bg-slate-50 pb-28 md:pb-12">
      {/* =========================================================
          HERO & APP MODE TOGGLE
      ========================================================== */}
      <section className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-5">
          {/* Header Card */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-md">
            <img
              src={heroBannerImg}
              alt="Fresh Groceries"
              className="absolute inset-0 h-full w-full object-cover opacity-35"
              referrerPolicy="no-referrer"
            />
            <div className="relative z-10 p-4 sm:p-7">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Smart Express Checkout</span>
              </div>

              <h1 className="mt-1 text-xl font-extrabold tracking-tight text-white sm:text-3xl text-balance">
                Scan, Bag & Skip The Queue
              </h1>

              <p className="mt-0.5 max-w-xl text-xs text-slate-200 sm:text-sm">
                Point your phone camera at grocery barcodes as you shop, or browse store shelves.
              </p>

              {/* Segmented Mode Selector */}
              <div className="mt-3.5 inline-flex rounded-2xl bg-black/40 p-1 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setActiveTab("scan")}
                  className={`flex min-h-[38px] items-center gap-2 rounded-xl px-3.5 text-xs font-bold transition active:scale-95 ${
                    activeTab === "scan"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-200 hover:text-white"
                  }`}
                >
                  <QrCode className="h-4 w-4" />
                  <span>Scan Barcode</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("catalog")}
                  className={`flex min-h-[38px] items-center gap-2 rounded-xl px-3.5 text-xs font-bold transition active:scale-95 ${
                    activeTab === "catalog"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-200 hover:text-white"
                  }`}
                >
                  <Store className="h-4 w-4" />
                  <span>Browse Aisle ({catalogProducts.length || "150+"})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CONTENT SECTION: SCAN OR CATALOG
      ========================================================== */}
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-5">
            {activeTab === "scan" ? (
              <>
                {/* Scanner Component */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs">
                  <div className="mb-3.5 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                        Terminal Scanner
                      </h2>
                      <p className="text-xs text-slate-500">
                        Scan items with camera lens or enter barcode
                      </p>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Ready
                    </span>
                  </div>

                  <Scanner onProductFound={handleProductFound} />
                </div>

                {/* Scanned Item Spotlight Card */}
                {scannedProduct && (
                  <div>
                    <div className="mb-2 flex items-center justify-between px-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Last Scanned Item
                      </span>
                      <button
                        onClick={() => setScannedProduct(null)}
                        className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                      >
                        Dismiss
                      </button>
                    </div>
                    <ProductCard
                      product={scannedProduct}
                      onAddToCart={(prod) => addToCart(prod)}
                    />
                  </div>
                )}
              </>
            ) : (
              /* Aisle Catalog View */
              <div className="space-y-4">
                {/* Search & Filter Header */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search supermarket shelves (e.g. Milk, Rice, Chips)..."
                      className="w-full min-h-[44px] rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-9 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Category Filter Horizontal Carousel */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`min-h-[34px] shrink-0 rounded-xl px-3 text-xs font-semibold transition active:scale-95 ${
                          selectedCategory === cat
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Cards Grid */}
                {loadingCatalog ? (
                  <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                    Loading fresh store products...
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
                    <p className="text-base font-bold text-slate-800">No products matched "{searchQuery}"</p>
                    <p className="mt-1 text-xs text-slate-400">Try searching for common items like Milk or Noodles</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {filteredProducts.map((p) => {
                      const inCartItem = cart.find((c) => c.id === p.id);
                      return (
                        <div
                          key={p.id}
                          className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:border-emerald-300"
                        >
                          <div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>{p.category || "General"}</span>
                              <span className="font-mono text-[10px]">{p.barcode?.slice(-5)}</span>
                            </div>

                            <h3 className="mt-1 font-bold text-sm text-slate-900 line-clamp-1">
                              {p.name}
                            </h3>
                            <p className="text-xs text-slate-500">
                              {p.brand} {p.quantity ? `· ${p.quantity}` : ""}
                            </p>
                          </div>

                          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                            <div>
                              <span className="text-base font-extrabold text-slate-900 tabular-nums">
                                ₹{Number(p.price).toFixed(2)}
                              </span>
                              {p.mrp > p.price && (
                                <span className="ml-1.5 text-xs text-slate-400 line-through tabular-nums">
                                  ₹{Number(p.mrp).toFixed(2)}
                                </span>
                              )}
                            </div>

                            {inCartItem ? (
                              <div className="flex items-center rounded-xl border border-emerald-300 bg-emerald-50/70 p-0.5">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(p.id, inCartItem.quantity - 1)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-800 shadow-2xs transition active:scale-90"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="flex min-w-[28px] items-center justify-center text-xs font-bold tabular-nums text-emerald-900">
                                  {inCartItem.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(p.id, inCartItem.quantity + 1)}
                                  disabled={inCartItem.quantity >= p.stock}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs transition active:scale-90 disabled:opacity-40"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(p)}
                                className="flex h-9 items-center gap-1 rounded-xl bg-emerald-600 px-3.5 text-xs font-bold text-white shadow-xs transition active:scale-95 hover:bg-emerald-700"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Add</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Desktop Cart Panel */}
          <div className="hidden lg:block">
            <div className="sticky top-20 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-slate-900">Your SmartCart</h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </span>
              </div>

              {/* Items List */}
              {cart.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                    🛍️
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-700">Your cart is empty</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Scan product barcodes to fill your cart.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <CartItem key={item.id} item={item} />
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Subtotal</span>
                      <span className="tabular-nums font-semibold text-slate-800">
                        ₹{totalAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-emerald-600">
                      <span>Express Checkout Discount</span>
                      <span>FREE</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                      <span className="text-sm font-bold text-slate-900">Estimated Total</span>
                      <span className="text-xl font-extrabold text-slate-900 tabular-nums">
                        ₹{totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate("/checkout")}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-md shadow-emerald-700/20 transition active:scale-98 hover:bg-emerald-700"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          MOBILE FLOATING ACTION DOCK (Thumb Zone - Native Touch App Experience)
      ========================================================== */}
      {totalItems > 0 && (
        <div className="fixed bottom-[68px] inset-x-0 z-30 px-3 md:hidden">
          <div className="mx-auto max-w-md">
            <button
              onClick={() => navigate("/checkout")}
              className="flex min-h-[52px] w-full items-center justify-between rounded-2xl bg-slate-950 px-4 py-3 text-white shadow-xl shadow-slate-950/30 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500 text-xs font-extrabold text-slate-950">
                  {totalItems}
                </span>
                <div className="text-left">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Bill</p>
                  <p className="text-sm font-extrabold tabular-nums">₹{totalAmount.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <span>View Cart & Pay</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/success" element={<SuccessPage />} />

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/products" element={<Products />} />
            <Route path="/admin/inventory" element={<Inventory />} />
            <Route path="/admin/orders" element={<Orders />} />
            <Route path="/admin/orders/:orderId" element={<OrderDetails />} />
            <Route path="/admin/payments" element={<Payments />} />
            <Route path="/admin/reports" element={<Reports />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
}

export default App;