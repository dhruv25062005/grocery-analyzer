import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createOrder } from "../services/orderService";

const CheckoutPage = () => {
  const {
    cart,
    totalItems,
    totalAmount,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDecrease = (item) => {
    updateQuantity(item.id, item.quantity - 1);
  };

  const handleIncrease = (item) => {
    if (item.quantity >= item.stock) {
      return;
    }

    updateQuantity(item.id, item.quantity + 1);
  };

  const handleRemove = (productId) => {
    removeFromCart(productId);
  };

  const handleContinueToPayment = async () => {
    if (cart.length === 0) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await createOrder(cart);

      console.log("Order created:", data);

      sessionStorage.setItem(
        "smartcart_order_id",
        String(data.order.id)
      );

      navigate("/payment", {
        state: {
          order: data.order,
        },
      });
    } catch (err) {
      console.error("Checkout error:", err);

      setError(
        err.message || "Unable to create order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Empty cart
  if (cart.length === 0) {
    return (
      <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="text-6xl">🛒</div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Your cart is empty
          </h1>

          <p className="mt-2 text-slate-500">
            Add some products before proceeding to checkout.
          </p>

          <button
            onClick={() => navigate("/")}
            className="mt-6 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
          >
            Back to Shopping
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/")}
            className="mb-5 text-sm font-medium text-slate-500 transition hover:text-green-600"
          >
            ← Continue Shopping
          </button>

          <p className="text-sm font-semibold uppercase tracking-wider text-green-600">
            Checkout
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Review Your Order
          </h1>

          <p className="mt-2 text-slate-500">
            Check your products and total before payment.
          </p>
        </div>

        {/* Main Layout */}
        <div className="grid gap-8 lg:grid-cols-3">

          {/* Products */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              {/* Products Header */}
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">
                    Your Products
                  </h2>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                    {totalItems} items
                  </span>
                </div>
              </div>

              {/* Product List */}
              <div className="divide-y divide-slate-200">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="px-6 py-5"
                  >
                    <div className="flex items-center gap-4">

                      {/* Product Info */}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-slate-900">
                          {item.name}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {item.brand || "Unknown Brand"}
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          ₹{Number(item.price).toFixed(2)} per item
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50">

                        <button
                          onClick={() => handleDecrease(item)}
                          className="flex h-9 w-9 items-center justify-center text-lg font-bold text-slate-600 transition hover:bg-slate-200"
                          aria-label={`Decrease ${item.name} quantity`}
                        >
                          −
                        </button>

                        <span className="flex h-9 min-w-10 items-center justify-center border-x border-slate-200 bg-white px-2 text-sm font-semibold text-slate-800">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => handleIncrease(item)}
                          disabled={item.quantity >= item.stock}
                          className="flex h-9 w-9 items-center justify-center text-lg font-bold text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          +
                        </button>

                      </div>

                      {/* Item Total */}
                      <div className="w-28 text-right">
                        <p className="font-bold text-slate-900">
                          ₹
                          {(
                            Number(item.price) *
                            item.quantity
                          ).toFixed(2)}
                        </p>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${item.name}`}
                        title="Remove product"
                      >
                        🗑️
                      </button>

                    </div>

                    {/* Stock Information */}
                    <div className="mt-3 flex justify-end">
                      <p className="text-xs text-slate-400">
                        {item.stock} available
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold text-slate-900">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4">

                <div className="flex justify-between text-slate-500">
                  <span>Items</span>
                  <span>{totalItems}</span>
                </div>

                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>

                  <span>
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-500">
                  <span>Discount</span>
                  <span>₹0.00</span>
                </div>

                <div className="flex justify-between text-slate-500">
                  <span>Tax</span>
                  <span>₹0.00</span>
                </div>

              </div>

              <div className="my-6 border-t border-slate-200" />

              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-slate-900">
                  Total
                </span>

                <span className="text-2xl font-bold text-green-600">
                  ₹{totalAmount.toFixed(2)}
                </span>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Payment Button */}
              <button
                onClick={handleContinueToPayment}
                disabled={loading || cart.length === 0}
                className="mt-6 w-full rounded-xl bg-green-600 px-5 py-4 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Creating Order..."
                  : "Continue to Payment →"}
              </button>

              <p className="mt-4 text-center text-xs text-slate-400">
                Your final amount will be verified by SmartCart.
              </p>

            </div>
          </div>

        </div>
      </div>
    </main>
  );
};

export default CheckoutPage;