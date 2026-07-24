import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useCart } from "../context/CartContext";
import { stockLevel } from "../stock";
import type { Product } from "../types";

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const { addToCart } = useCart();

  useEffect(() => {
    api
      .get<Product[]>("/api/products")
      .then(setProducts)
      .catch(() => setError("Failed to load products"));
  }, []);

  if (error) return <p className="error">{error}</p>;

  return (
    <div className="product-list">
      <h1>Electronics</h1>
      <p>Browse the catalog and add items to your cart.</p>
      <div className="product-grid">
        {products.map((product) => (
          <div className="product-card" key={product.id}>
            <Link to={`/products/${product.id}`}>
              <img src={product.imageUrl} alt={product.name} />
              <h3>{product.name}</h3>
            </Link>
            <p className="category">{product.category}</p>
            <p className="price">${product.price.toFixed(2)}</p>
            <span className="stock">
              <span className={`stock-dot ${stockLevel(product.stock)}`} />
              {product.stock === 0 ? "Out of stock" : `${product.stock} in stock`}
            </span>
            <button onClick={() => addToCart(product)} disabled={product.stock === 0}>
              {product.stock === 0 ? "Out of stock" : "Add to cart"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
