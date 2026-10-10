import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const CartSummary = () => {
  const {
    totalItems,
    totalAmount,
    clearCart,
  } = useCart();

  const navigate = useNavigate();

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="cart-summary">
      <h2>Cart Summary</h2>

      <p>
        Total Items: <strong>{totalItems}</strong>
      </p>

      <h3>
        Total: ₹{totalAmount.toFixed(2)}
      </h3>

      <div>
        <button onClick={clearCart}>
          Clear Cart
        </button>

        <button
          onClick={() => navigate("/checkout")}
        >
          Checkout
        </button>
      </div>
    </div>
  );
};

export default CartSummary;