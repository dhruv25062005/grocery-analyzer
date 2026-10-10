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
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    } else {
      removeFromCart(item.id);
    }
  };

  const handleIncrease = (item) => {
    if (item.quantity >= Number(item.stock)) return;
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleRemove = (productId) => {
    removeFromCart(productId);
  };

  const handleContinueToPayment = async () => {
    if (cart.length === 0 || loading) return;

    try {
      setLoading(true);
      setError("");

      const data = await createOrder(cart);

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

  const formatPrice = (amount) =>
    `₹${Number(amount || 0).toFixed(2)}`;

  const subtotal = cart.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  const savings = cart.reduce(
    (sum, item) =>
      sum +
      Math.max(
        0,
        Number(item.mrp || 0) - Number(item.price || 0)
      ) *
        Number(item.quantity || 0),
    0
  );

  const stockStatus = (item) => {
    const stock = Number(item.stock) || 0;

    if (stock <= 0) {
      return {
        label: "Out of stock",
        className: "bg-red-50 text-red-700",
      };
    }

    if (stock <= 10) {
      return {
        label: `${stock} available`,
        className: "bg-amber-50 text-amber-700",
      };
    }

    return {
      label: "In stock",
      className: "bg-emerald-50 text-emerald-700",
    };
  };

  // Empty cart
  if (cart.length === 0) {
    return (
      <main className="relative flex min-h-[calc(100vh-76px)] items-center justify-center overflow-hidden bg-[#F5F8F6] px-4 py-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-lime-100/50 blur-3xl" />

        <section className="relative w-full max-w-lg rounded-[28px] border border-[#E2E9E4] bg-white p-7 text-center shadow-[0_16px_60px_rgba(21,61,48,0.08)] sm:p-12">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] bg-emerald-50 text-5xl">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-12 w-12 text-[#153D30]"
              aria-hidden="true"
            >
              <path
                d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H6"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="19" r="1.5" fill="currentColor" />
              <circle cx="18" cy="19" r="1.5" fill="currentColor" />
            </svg>
          </div>

          <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
            SmartCart checkout
          </p>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#153D30]">
            Your basket is empty
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-500">
            You haven't scanned any products yet. Head back to the scanner
            to start building your basket.
          </p>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#153D30] px-6 py-3 font-bold text-white shadow-lg shadow-emerald-950/10 transition hover:-translate-y-0.5 hover:bg-[#205541] hover:shadow-xl sm:w-auto"
          >
            <span aria-hidden="true">⌗</span>
            Back to scanner
            <span aria-hidden="true">→</span>
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-[calc(100vh-76px)] overflow-hidden bg-[#F5F8F6] text-[#17231F]">
      {/* Background accents */}
      <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-emerald-200/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 top-[450px] h-80 w-80 rounded-full bg-lime-100/40 blur-3xl" />

      <div className="relative mx-auto max-w-[1240px] px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        {/* Back navigation */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="group mb-7 inline-flex items-center gap-2 rounded-lg py-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4 transition-transform group-hover:-translate-x-1"
            aria-hidden="true"
          >
            <path
              d="m15 18-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Continue shopping
        </button>

        {/* Checkout heading */}
        <header className="mb-8 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#153D30] via-[#174A37] to-[#087F5B] p-6 text-white shadow-xl shadow-emerald-950/10 sm:p-9">
          <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.17em] text-emerald-50">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D9F99D]" />
                Secure self-checkout
              </div>

              <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Review your basket<span className="text-[#D9F99D]">.</span>
              </h1>

              <p className="mt-3 max-w-lg text-sm leading-6 text-emerald-50/80 sm:text-base">
                Double-check your products and quantities before completing
                your purchase.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur-sm sm:min-w-48">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D9F99D] text-[#153D30]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path
                    d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 12v9M4.5 7.5 12 12l7.5-4.5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <p className="text-xs text-emerald-50/70">
                  Products scanned
                </p>
                <p className="mt-0.5 text-2xl font-extrabold">
                  {totalItems}
                </p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-8 flex max-w-md items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D9F99D] text-xs text-[#153D30]">
                1
              </span>
              Review
            </div>

            <div className="h-px flex-1 bg-white/25" />

            <div className="flex items-center gap-2 text-sm text-white/65">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/30 text-xs">
                2
              </span>
              Payment
            </div>
          </div>
        </header>

        {/* Main layout */}
        <div className="grid items-start gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Product list */}
          <section className="min-w-0 lg:col-span-8">
            <div className="overflow-hidden rounded-[24px] border border-[#E2E9E4] bg-white shadow-[0_4px_20px_rgba(21,61,48,0.04)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight text-[#153D30] sm:text-xl">
                    Basket items
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Check each product before payment.
                  </p>
                </div>

                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {cart.map((item) => {
                  const status = stockStatus(item);
                  const itemStock = Number(item.stock) || 0;
                  const itemPrice = Number(item.price) || 0;

                  return (
                    <article
                      key={item.id}
                      className="p-4 transition-colors hover:bg-[#FAFCFA] sm:p-6"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        {/* Product identifier */}
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-800 sm:h-14 sm:w-14">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-6 w-6 sm:h-7 sm:w-7"
                            aria-hidden="true"
                          >
                            <path
                              d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M12 12v9M4.5 7.5 12 12l7.5-4.5"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>

                        {/* Product information */}
                        <div className="min-w-0 flex-1">
                          <h3 className="break-words font-bold leading-5 text-slate-900 sm:text-base">
                            {item.name}
                          </h3>

                          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                            {item.brand || "Unbranded product"}
                          </p>

                          <p className="mt-2 text-sm font-semibold text-[#153D30]">
                            {formatPrice(itemPrice)}
                            <span className="ml-1 text-xs font-normal text-slate-400">
                              / unit
                            </span>
                          </p>

                          <div className="mt-2">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold sm:text-xs ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </div>
                        </div>

                        {/* Item total */}
                        <div className="shrink-0 text-right">
                          <p className="text-base font-extrabold tracking-tight text-[#153D30] sm:text-lg">
                            {formatPrice(itemPrice * item.quantity)}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-400 sm:text-xs">
                            Item total
                          </p>
                        </div>
                      </div>

                      {/* Quantity and remove */}
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pl-0 sm:pl-[72px]">
                        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white shadow-sm">
                          <button
                            type="button"
                            onClick={() => handleDecrease(item)}
                            aria-label={
                              item.quantity === 1
                                ? `Remove ${item.name} from basket`
                                : `Decrease ${item.name} quantity`
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-l-xl text-lg font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600"
                          >
                            {item.quantity === 1 ? "−" : "−"}
                          </button>

                          <span
                            aria-label={`Quantity ${item.quantity}`}
                            className="flex h-10 min-w-11 items-center justify-center border-x border-slate-200 px-2 text-sm font-bold text-slate-800"
                          >
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleIncrease(item)}
                            disabled={item.quantity >= itemStock}
                            aria-label={`Increase ${item.name} quantity`}
                            className="flex h-10 w-10 items-center justify-center rounded-r-xl text-lg font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 sm:text-sm"
                          aria-label={`Remove ${item.name} from basket`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-4 w-4"
                            aria-hidden="true"
                          >
                            <path
                              d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Remove
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Continue shopping */}
              <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-7">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 transition hover:text-emerald-950"
                >
                  <span aria-hidden="true">+</span>
                  Scan more products
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>

            {/* Trust information */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-2xl border border-[#E2E9E4] bg-white p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 3 5 6v5c0 4.5 2.8 7.8 7 10 4.2-2.2 7-5.5 7-10V6l-7-3Z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                    <path
                      d="m9 12 2 2 4-4"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Review before payment
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Confirm your quantities and bill before proceeding.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-[#E2E9E4] bg-white p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                    <path
                      d="M3 10h18"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                  </svg>
                </span>

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Clear bill summary
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    See your item totals and savings before continuing.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Order summary */}
          <aside className="min-w-0 lg:col-span-4">
            <section className="overflow-hidden rounded-[24px] border border-[#E2E9E4] bg-white shadow-[0_8px_30px_rgba(21,61,48,0.06)] lg:sticky lg:top-24">
              <div className="bg-gradient-to-br from-[#F0F8F2] to-white p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#153D30] text-white shadow-sm">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-6 w-6"
                      aria-hidden="true"
                    >
                      <path
                        d="M7 3h10v18H7zM9 7h6M9 11h6M9 15h4"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                      Your bill
                    </p>
                    <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[#153D30]">
                      Order summary
                    </h2>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500">Total items</span>
                    <span className="font-semibold text-slate-800">
                      {totalItems}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-semibold text-slate-800">
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500">Product savings</span>
                    <span className="font-semibold text-emerald-700">
                      −{formatPrice(savings)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500">Additional discount</span>
                    <span className="font-medium text-slate-600">
                      {formatPrice(0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500">Tax</span>
                    <span className="font-medium text-slate-600">
                      Included in listed prices
                    </span>
                  </div>
                </div>

                <div className="my-6 border-t border-dashed border-slate-200" />

                <div className="rounded-2xl bg-[#F5F8F6] p-4">
                  <p className="text-xs font-semibold text-slate-500">
                    Total payable
                  </p>

                  <div className="mt-2 flex items-baseline justify-between gap-3">
                    <span className="text-xs text-slate-500">
                      Final bill
                    </span>
                    <span className="text-2xl font-extrabold tracking-tight text-[#153D30] sm:text-3xl">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                  >
                    <span className="font-bold" aria-hidden="true">
                      !
                    </span>
                    <p className="leading-6">{error}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleContinueToPayment}
                  disabled={loading || cart.length === 0}
                  className="group mt-5 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#153D30] px-4 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-950/10 transition duration-200 hover:-translate-y-0.5 hover:bg-[#205541] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <svg
                        className="h-5 w-5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="currentColor"
                          strokeWidth="3"
                          className="opacity-25"
                        />
                        <path
                          d="M21 12a9 9 0 0 0-9-9"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          className="opacity-90"
                        />
                      </svg>
                      Creating order...
                    </>
                  ) : (
                    <>
                      Continue to payment
                      <span className="transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </>
                  )}
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <rect
                      x="5"
                      y="10"
                      width="14"
                      height="11"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                    <path
                      d="M8 10V7a4 4 0 0 1 8 0v3"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>
                  Review your order before payment
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="mt-5 w-full rounded-xl py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-emerald-800"
                >
                  ← Return to scanner
                </button>
              </div>
            </section>
          </aside>
        </div>

        {/* Footer */}
        <footer className="mt-10 border-t border-[#E2E9E4] py-6 text-center">
          <p className="text-sm font-bold tracking-tight text-[#153D30]">
            SmartCart<span className="text-emerald-600">.</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Scan smarter. Shop faster. Checkout easier.
          </p>
        </footer>
      </div>
    </main>
  );
};

export default CheckoutPage;
