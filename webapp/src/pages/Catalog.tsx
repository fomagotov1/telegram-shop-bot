import { useState, useEffect } from 'react';
import axios from 'axios';
import { Product } from '../types';
import { useCart } from '../hooks/useCart';
import ProductCard from '../components/ProductCard';
import './Catalog.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const addItem = useCart((state) => state.addItem);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await axios.get(`${API_URL}/products`);
      setProducts(res.data);
    } catch (e) {
      console.error('Failed to fetch products:', e);
    } finally {
      setLoading(false);
    }
  }

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[];
  const filtered = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  return (
    <div className="catalog">
      <header className="catalog-header">
        <h1 className="catalog-title">Каталог</h1>
      </header>

      {categories.length > 0 && (
        <div className="categories-scroll">
          <button
            className={`category-chip ${!selectedCategory ? 'active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            Все
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="catalog-loading">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="catalog-empty">
          <p>Товары скоро появятся</p>
        </div>
      ) : (
        <div className="products-grid">
          {filtered.map((product, i) => (
            <div
              key={product.id}
              className="animate-slide-up"
              style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'both' }}
            >
              <ProductCard product={product} onAdd={() => addItem(product)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
