import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const isMaxQuantity = item.quantity >= item.stock;
  const unitPrice = Number(item.price || 0);
  const lineTotal = unitPrice * Number(item.quantity || 1);

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 transition-all">
      {/* Product Details */}
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-bold text-slate-900">
          {item.name}
        </h4>

        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
          <span className="tabular-nums font-semibold text-slate-700">
            ₹{unitPrice.toFixed(2)}
          </span>
          <span aria-hidden="true">·</span>
          <span>{item.quantity} {item.quantity > 1 ? "units" : "unit"}</span>
          {item.stock && item.stock <= 5 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-amber-600 font-medium">Only {item.stock} left</span>
            </>
          )}
        </div>
      </div>

      {/* Touch-Friendly Stepper Quantity Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5">
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white active:scale-90"
            aria-label={`Decrease ${item.name} quantity`}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          <span className="flex h-8 min-w-[28px] items-center justify-center text-xs font-bold tabular-nums text-slate-900">
            {item.quantity}
          </span>

          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            disabled={isMaxQuantity}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Increase ${item.name} quantity`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Remove Button */}
        <button
          onClick={() => removeFromCart(item.id)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 active:scale-95"
          aria-label={`Remove ${item.name} from cart`}
          title="Remove"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Line Total */}
      <div className="w-20 text-right shrink-0">
        <span className="text-sm font-extrabold text-slate-900 tabular-nums">
          ₹{lineTotal.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default CartItem;