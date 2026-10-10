import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag, ShieldCheck, ArrowRight, User, Phone } from "lucide-react";
import { useCart } from "../context/CartContext";
import { createOrder } from "../services/orderService";
import CartItem from "../components/CartItem";

const CheckoutPage = () => {
  const { cart, totalItems, totalAmount } = useCart();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState("Amit Gupta");
  const [customerPhone, setCustomerPhone] = useState("+91 98765 43210");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContinueToPayment = async () => {
    if (cart.length === 0) return;

    try {
      setLoading(true);
      setError("");

      const data = await createOrder(cart);

      sessionStorage.setItem("smartcart_order_id", String(data.order.id));
      sessionStorage.setItem("smartcart_customer_name", customerName);
      sessionStorage.setItem("smartcart_customer_phone", customerPhone);

      navigate("/payment", {
        state: {
          order: data.order,
          customer: { name: customerName, phone: customerPhone },
        },
      });
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.message || "Unable to create order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Empty cart state
  if (cart.length === 0) {
    return (
      <main className="min-h-[calc(100dvh-58px)] bg-slate-50 px-4 py-12 flex items-center justify-center">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200/90 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-3xl text-emerald-600">
            <ShoppingBag className="h-8 w-8" />
          </div>

          <h1 className="mt-4 text-xl font-extrabold text-slate-900">
            Your cart is empty
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Scan product barcodes or browse aisles to add grocery items.
          </p>

          <button
            onClick={() => navigate("/")}
            className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 font-bold text-white shadow-md shadow-emerald-700/20 active:scale-95 transition"
          >
            <span>Start Scanning Items</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100dvh-58px)] bg-slate-50 px-4 py-5 pb-32 sm:px-6 sm:py-8 lg:pb-12">
      <div className="mx-auto max-w-4xl">
        {/* Navigation Back */}
        <button
          onClick={() => navigate("/")}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Barcode Scanner</span>
        </button>

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Express Checkout
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review your scanned grocery items and bill summary
            </p>
          </div>

          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            {totalItems} items
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Items & Customer Information */}
          <div className="lg:col-span-2 space-y-4">
            {/* Customer Details Sheet */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Customer & Receipt Contact
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold">SMS Pass Enabled</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full min-h-[44px] rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full min-h-[44px] rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Scanned Items List */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
              <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Scanned Items</h2>
                <span className="text-xs text-slate-500">{totalItems} in bag</span>
              </div>

              <div className="space-y-2.5">
                {cart.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          </div>

          {/* Bill Summary Column */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900">Bill Breakdown</h2>

              <div className="mt-4 space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Cart Items ({totalItems})</span>
                  <span className="tabular-nums font-semibold text-slate-900">
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-emerald-600">
                  <span>Store Self-Checkout Savings</span>
                  <span>-₹0.00</span>
                </div>

                <div className="flex justify-between text-slate-500">
                  <span>Reusable Paper Bag</span>
                  <span>FREE</span>
                </div>

                <div className="flex justify-between text-slate-500">
                  <span>GST / Store Tax</span>
                  <span>Included</span>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-baseline justify-between">
                  <span className="text-sm font-bold text-slate-900">Total Payable</span>
                  <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-2xl bg-rose-50 p-3 text-xs text-rose-700">
                  {error}
                </div>
              )}

              {/* Desktop Checkout CTA */}
              <button
                onClick={handleContinueToPayment}
                disabled={loading}
                className="mt-5 hidden sm:flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 font-bold text-white shadow-md shadow-emerald-700/20 active:scale-98 transition hover:bg-emerald-700 disabled:opacity-60"
              >
                <span>{loading ? "Generating Secure Order..." : `Pay ₹${totalAmount.toFixed(2)}`}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Verified 256-bit encrypted checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          MOBILE STICKY BOTTOM ACTION BAR (Thumb Ergonomics)
      ========================================================== */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 p-3.5 backdrop-blur-xl pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
        <div className="mx-auto max-w-md flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-slate-400 font-medium">To Pay</p>
            <p className="text-lg font-extrabold text-slate-900 tabular-nums">
              ₹{totalAmount.toFixed(2)}
            </p>
          </div>

          <button
            onClick={handleContinueToPayment}
            disabled={loading}
            className="flex-1 flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-md shadow-emerald-700/20 active:scale-98 transition disabled:opacity-60"
          >
            <span>{loading ? "Processing..." : "Select Payment →"}</span>
          </button>
        </div>
      </div>
    </main>
  );
};

export default CheckoutPage;