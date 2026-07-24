import { useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api";
import { useCart } from "../context/CartContext";

interface CheckoutResult {
  orderId: string;
  total: number;
}

export default function Checkout() {
  const { lines, total, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CheckoutResult | null>(null);

  async function handlePlaceOrder() {
    setSubmitting(true);
    setError("");
    try {
      const order = await api.post<CheckoutResult>("/api/checkout", {
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      });
      setResult(order);
      clearCart();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="checkout-page">
        <h1>Order confirmed</h1>
        <p>Order {result.orderId} placed for ${result.total.toFixed(2)}.</p>
        <Link to="/">Continue shopping</Link>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="checkout-page">
        <h1>Checkout</h1>
        <p>
          Your cart is empty. <Link to="/">Browse products</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      <ul>
        {lines.map((line) => (
          <li key={line.product.id}>
            {line.quantity} &times; {line.product.name} — ${(line.product.price * line.quantity).toFixed(2)}
          </li>
        ))}
      </ul>
      <p className="total">Total: ${total.toFixed(2)}</p>
      {error && <p className="error">{error}</p>}
      <button onClick={handlePlaceOrder} disabled={submitting}>
        {submitting ? "Processing payment..." : "Place order"}
      </button>
      <p>
        <Link to="/cart">Back to cart</Link>
      </p>
    </div>
  );
}
