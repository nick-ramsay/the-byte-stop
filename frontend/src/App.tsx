import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import logo from "./assets/logo.svg";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider, useCart } from "./context/CartContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import CartPage from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import "./App.css";

function Nav() {
  const { user, logout } = useAuth();
  const { lines } = useCart();
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <nav className="nav">
      <Link to="/" className="brand">
        <img src={logo} alt="" width={28} height={28} />
        The Byte Stop
      </Link>
      <div className="nav-links">
        <Link to="/cart">Cart ({itemCount})</Link>
        {user ? (
          <>
            <span>Hi, {user.name}</span>
            <button onClick={() => logout()}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/signup">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Nav />
          <main className="page-content">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<ProductList />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<CartPage />} />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/order-confirmation/:orderId"
                  element={
                    <ProtectedRoute>
                      <OrderConfirmation />
                    </ProtectedRoute>
                  }
                />
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
