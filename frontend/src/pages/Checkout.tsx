import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { api, ApiError } from "../api";
import { useCart } from "../context/CartContext";

interface CheckoutResult {
  orderId: string;
  total: number;
}

export default function Checkout() {
  const { lines, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handlePlaceOrder() {
    setSubmitting(true);
    setError("");
    try {
      const order = await api.post<CheckoutResult>("/api/checkout", {
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      });
      clearCart();
      navigate(`/order-confirmation/${order.orderId}`, { state: { total: order.total } });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Checkout failed";
      setError(message);
      datadogLogs.logger.error("checkout failed", {
        error: { message },
        status: err instanceof ApiError ? err.status : undefined,
        cartTotal: total,
        itemCount: lines.length,
      });
      datadogRum.addError(err, {
        status: err instanceof ApiError ? err.status : undefined,
        cartTotal: total,
        itemCount: lines.length,
      });
    } finally {
      setSubmitting(false);
    }
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
