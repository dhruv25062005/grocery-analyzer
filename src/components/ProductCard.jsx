import { Plus, Minus, AlertTriangle } from "lucide-react";
import { useCart } from "../context/CartContext";

const ProductCard = ({ product, onAddToCart }) => {
  const { cart, addToCart, updateQuantity } = useCart();

  if (!product) return null;

  const inCartItem = cart.find((item) => item.id === product.id);
  const isOutOfStock = Number(product.stock) <= 0;
  const price = Number(product.price || 0);
  const mrp = Number(product.mrp || 0);
  const savings = mrp > price ? mrp - price : 0;
  const discountPercent = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const handleAdd = () => {
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      addToCart(product);
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition-all hover:shadow-md">
      {/* Top Details & Availability */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span>{product.category || "Grocery"}</span>
            <span aria-hidden="true">·</span>
            <span>{product.brand || "Standard Brand"}</span>
            {product.quantity && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-slate-700">{product.quantity}</span>
              </>
            )}
          </div>

          <h2 className="mt-1 text-base sm:text-lg font-bold tracking-tight text-slate-900 line-clamp-2">
            {product.name}
          </h2>

          <p className="mt-0.5 text-[11px] font-mono text-slate-400">
            Barcode: {product.barcode}
          </p>
        </div>

        {/* Stock Status Indicator */}
        <div className="shrink-0 text-right">
          {isOutOfStock ? (
            <span className="text-xs font-bold text-rose-600">
              Out of stock
            </span>
          ) : (
            <span className="text-xs font-medium text-emerald-700">
              In Stock · <span className="font-bold tabular-nums">{product.stock}</span> left
            </span>
          )}
        </div>
      </div>

      {/* Pricing & Savings Breakdown */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tabular-nums">
              ₹{price.toFixed(2)}
            </span>
            {mrp > price && (
              <span className="text-xs sm:text-sm text-slate-400 line-through tabular-nums">
                ₹{mrp.toFixed(2)}
              </span>
            )}
          </div>

          {savings > 0 && (
            <p className="text-[11px] font-semibold text-emerald-600">
              Save ₹{savings.toFixed(2)} ({discountPercent}% off)
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div>
          {isOutOfStock ? (
            <button
              disabled
              className="flex min-h-[44px] items-center gap-1.5 rounded-2xl bg-slate-100 px-4 text-xs font-semibold text-slate-400 cursor-not-allowed"
            >
              <AlertTriangle className="h-4 w-4" />
              Unavailable
            </button>
          ) : inCartItem ? (
            /* Direct Stepper */
            <div className="flex items-center rounded-2xl border border-emerald-300 bg-emerald-50/70 p-1">
              <button
                type="button"
                onClick={() => updateQuantity(product.id, inCartItem.quantity - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-800 shadow-2xs transition active:scale-90"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>

              <span className="flex min-w-[32px] items-center justify-center text-xs font-bold tabular-nums text-emerald-900">
                {inCartItem.quantity}
              </span>

              <button
                type="button"
                onClick={() => updateQuantity(product.id, inCartItem.quantity + 1)}
                disabled={inCartItem.quantity >= product.stock}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-2xs transition active:scale-90 disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              className="flex min-h-[44px] items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm transition active:scale-95 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add to Bag</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;