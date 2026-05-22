import { Product } from '../types';
import './ProductCard.css';

interface Props {
  product: Product;
  onAdd: () => void;
  onClick: () => void;
}

export default function ProductCard({ product, onAdd, onClick }: Props) {
  const priceRub = product.price;

  return (
    <div className="product-card" onClick={onClick}>
      <div className="product-card-image">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy" />
        ) : (
          <div className="product-card-placeholder">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
        <button className="product-card-add" onClick={(e) => { e.stopPropagation(); onAdd(); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <span className="product-card-price">{priceRub.toLocaleString('ru-RU')} ₽</span>
      </div>
      <div className="product-card-body">
        <h3 className="product-card-name">{product.name}</h3>
        {product.description && (
          <p className="product-card-desc">{product.description}</p>
        )}
      </div>
    </div>
  );
}
