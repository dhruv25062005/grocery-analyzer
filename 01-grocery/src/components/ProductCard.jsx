const ProductCard = ({ product }) => {
  if (!product) return null;

  const stock = Math.max(0, Number(product.stock) || 0);
  const price = Number(product.price) || 0;
  const mrp = Number(product.mrp) || 0;

  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 10;
  const hasDiscount = mrp > price && mrp > 0;

  const discountPercent = hasDiscount
    ? Math.round(((mrp - price) / mrp) * 100)
    : 0;

  const stockPercent = Math.min((stock / 30) * 100, 100);

  return (
    <section
      aria-label="Scanned product details"
      className="overflow-hidden rounded-3xl border border-[#E2E9E4] bg-white shadow-[0_8px_30px_rgba(21,61,48,0.06)]"
    >
      {/* Product heading */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#F0F8F2] via-white to-[#E8F5EC] p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full border border-emerald-900/5" />
        <div className="pointer-events-none absolute -right-3 -top-5 h-28 w-28 rounded-full border border-emerald-900/5" />

        <div className="relative flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-emerald-800 shadow-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-7 w-7"
              aria-hidden="true"
            >
              <path
                d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path
                d="m4.5 7.5 7.5 4.3 7.5-4.3M12 12v8.5M8 5.3l8 4.6"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Product identified
              </span>
            </div>

            <h2 className="break-words text-xl font-extrabold leading-tight tracking-tight text-[#153D30] sm:text-2xl">
              {product.name}
            </h2>

            <p className="mt-1.5 text-sm font-medium text-slate-500">
              {product.brand || "Unbranded product"}
            </p>

            {product.category && (
              <span className="mt-3 inline-flex rounded-lg bg-emerald-900/[0.06] px-2.5 py-1 text-xs font-medium text-emerald-900">
                {product.category}
              </span>
            )}
          </div>

          <span
            className={`shrink-0 rounded-xl border px-2.5 py-2 text-xs font-bold ${
              isOutOfStock
                ? "border-red-200 bg-red-50 text-red-700"
                : isLowStock
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {isOutOfStock
              ? "Unavailable"
              : isLowStock
              ? "Low stock"
              : "In stock"}
          </span>
        </div>
      </div>

      {/* Price panel */}
      <div className="p-5 sm:p-7">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate-500">
                SmartCart price
              </p>

              <div className="mt-2 flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-[#153D30] sm:text-4xl">
                  ₹{price.toFixed(2)}
                </span>

                {hasDiscount && (
                  <span className="text-sm font-medium text-slate-400 line-through">
                    ₹{mrp.toFixed(2)}
                  </span>
                )}
              </div>

              {product.quantity && (
                <p className="mt-1.5 text-xs text-slate-500">
                  Pack size: {product.quantity}
                </p>
              )}
            </div>

            {hasDiscount && (
              <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-800">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    d="m5 12 4 4L19 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {discountPercent}% off
              </span>
            )}
          </div>
        </div>

        {/* Stock information */}
        <div className="mt-5 rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 12v9"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                </svg>
              </span>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Available inventory
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Current stock level
                </p>
              </div>
            </div>

            <p
              className={`text-sm font-extrabold ${
                isOutOfStock
                  ? "text-red-600"
                  : isLowStock
                  ? "text-amber-600"
                  : "text-emerald-700"
              }`}
            >
              {stock} units
            </p>
          </div>

          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label="Relative stock indicator"
            aria-valuemin={0}
            aria-valuemax={30}
            aria-valuenow={Math.min(stock, 30)}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOutOfStock
                  ? "bg-red-500"
                  : isLowStock
                  ? "bg-amber-400"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${stockPercent}%` }}
            />
          </div>

          <p className="mt-2 text-xs text-slate-400">
            {isOutOfStock
              ? "This product is currently unavailable."
              : isLowStock
              ? "Limited stock remaining. Quantity is restricted by inventory."
              : "Stock is available for purchase."}
          </p>
        </div>

        {/* Scan status */}
        <div
          role="status"
          className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 ${
            isOutOfStock
              ? "border-red-200 bg-red-50"
              : "border-emerald-200 bg-emerald-50/70"
          }`}
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              isOutOfStock
                ? "bg-red-100 text-red-700"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {isOutOfStock ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  d="m7 7 10 10M17 7 7 17"
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
                  d="m5 12 4 4L19 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>

          <div className="min-w-0">
            <p
              className={`text-sm font-bold ${
                isOutOfStock ? "text-red-800" : "text-emerald-900"
              }`}
            >
              {isOutOfStock
                ? "Product unavailable"
                : "Automatic cart processing"}
            </p>

            <p
              className={`mt-1 text-xs leading-5 ${
                isOutOfStock ? "text-red-700" : "text-emerald-800"
              }`}
            >
              {isOutOfStock
                ? "This product cannot be purchased because no stock is available."
                : "This product is added automatically when scanned. Scan another item to continue shopping."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductCard;
