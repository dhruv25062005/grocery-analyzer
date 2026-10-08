const ProductCard = ({ product, onAddToCart }) => {
  if (!product) return null;

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* Product Header */}
      <div className="flex items-start justify-between border-b border-slate-200 p-6">

        <div>
          <p className="mb-1 text-sm font-medium text-green-600">
            Product Found
          </p>

          <h2 className="text-2xl font-bold text-slate-900">
            {product.name}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {product.brand || "Unknown Brand"}
          </p>
        </div>

        <div className="rounded-xl bg-green-100 px-3 py-2 text-sm font-semibold text-green-700">
          ✓ Available
        </div>

      </div>

      {/* Product Details */}
      <div className="grid gap-4 p-6 sm:grid-cols-2">

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Category
          </p>

          <p className="mt-1 font-semibold text-slate-800">
            {product.category || "N/A"}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Quantity
          </p>

          <p className="mt-1 font-semibold text-slate-800">
            {product.quantity || "N/A"}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            MRP
          </p>

          <p className="mt-1 font-semibold text-slate-500 line-through">
            ₹{Number(product.mrp).toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl bg-green-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-green-600">
            SmartCart Price
          </p>

          <p className="mt-1 text-2xl font-bold text-green-700">
            ₹{Number(product.price).toFixed(2)}
          </p>
        </div>

      </div>

      {/* Stock */}
      <div className="px-6">
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">

          <span className="text-sm text-slate-500">
            Available Stock
          </span>

          <span
            className={`font-semibold ${
              product.stock > 10
                ? "text-green-600"
                : product.stock > 0
                ? "text-orange-500"
                : "text-red-600"
            }`}
          >
            {product.stock} units
          </span>

        </div>
      </div>

      {/* Add Button */}
      <div className="p-6">

        <button
          onClick={() => onAddToCart(product)}
          disabled={isOutOfStock}
          className="w-full rounded-xl bg-green-600 px-5 py-4 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>

      </div>

    </div>
  );
};

export default ProductCard;