import { useCart } from "../context/CartContext";

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const isMaxQuantity = item.quantity >= item.stock;

  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 py-5 sm:flex-row sm:items-center sm:justify-between">

      {/* Product information */}
      <div className="flex-1">
        <h3 className="font-semibold text-slate-900">
          {item.name}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          ₹{Number(item.price).toFixed(2)} × {item.quantity}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Stock available: {item.stock}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">

        <button
          onClick={() =>
            updateQuantity(item.id, item.quantity - 1)
          }
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-lg font-semibold text-slate-700 hover:bg-slate-100"
        >
          −
        </button>

        <span className="flex h-9 min-w-10 items-center justify-center rounded-lg bg-slate-100 px-3 font-semibold text-slate-800">
          {item.quantity}
        </span>

        <button
          onClick={() =>
            updateQuantity(item.id, item.quantity + 1)
          }
          disabled={isMaxQuantity}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-lg font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>

        <button
          onClick={() => removeFromCart(item.id)}
          className="ml-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Remove
        </button>

      </div>

      {/* Item total */}
      <strong className="min-w-24 text-right text-lg text-slate-900">
        ₹{(Number(item.price) * item.quantity).toFixed(2)}
      </strong>

    </div>
  );
};

export default CartItem;