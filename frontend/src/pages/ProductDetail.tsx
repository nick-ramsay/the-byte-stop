import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useCart } from "../context/CartContext";
import { stockLevel } from "../stock";
import type { Product } from "../types";

export default function ProductDetail() {
  const { id = "" } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const { addToCart } = useCart();

  useEffect(() => {
    api
      .get<Product>(`/api/products/${id}`)
      .then(setProduct)
      .catch(() => setError("Product not found"));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!product) return <p>Loading...</p>;

  return (
    <div className="product-detail">
      <Link to="/">&larr; Back to store</Link>
      <div className="product-detail-body">
        <img src={product.imageUrl} alt={product.name} />
        <div>
          <h1>{product.name}</h1>
          <p className="category">{product.category}</p>
          <p>
            {product.description.length > 200
              ? `${product.description.slice(0, 200)}...`
              : product.description}
          </p>
          <p className="price">${product.price.toFixed(2)}</p>
          <span className="stock">
            <span className={`stock-dot ${stockLevel(product.stock)}`} />
            {product.stock === 0 ? "Out of stock" : `${product.stock} in stock`}
          </span>
          <button onClick={() => addToCart(product)} disabled={product.stock === 0}>
            {product.stock === 0 ? "Out of stock" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
