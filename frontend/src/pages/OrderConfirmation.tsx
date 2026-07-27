import { Link, Navigate, useLocation, useParams } from "react-router-dom";

interface OrderConfirmationState {
  total: number;
}

export default function OrderConfirmation() {
  const { orderId = "" } = useParams();
  const location = useLocation();
  const state = location.state as OrderConfirmationState | null;

  if (!state) return <Navigate to="/" replace />;

  return (
    <div className="checkout-page">
      <h1>Order confirmed</h1>
      <p>
        Order {orderId} placed for ${state.total.toFixed(2)}.
      </p>
      <Link to="/">Continue shopping</Link>
    </div>
  );
}
