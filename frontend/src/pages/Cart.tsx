import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const { lines, updateQuantity, removeFromCart, total } = useCart();
  const navigate = useNavigate();

  if (lines.length === 0) {
    return (
      <div className="cart-page">
        <h1>Your cart</h1>
        <p>
          Your cart is empty. <Link to="/">Browse products</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Your cart</h1>
      <table>
        <tbody>
          {lines.map((line) => (
            <tr key={line.product.id}>
              <td>{line.product.name}</td>
              <td>${line.product.price.toFixed(2)}</td>
              <td>
                <input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) => updateQuantity(line.product.id, Number(e.target.value))}
                />
              </td>
              <td>${(line.product.price * line.quantity).toFixed(2)}</td>
              <td>
                <button onClick={() => removeFromCart(line.product.id)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="total">Total: ${total.toFixed(2)}</p>
      <button onClick={() => navigate("/checkout")}>Proceed to checkout</button>
    </div>
  );
}
