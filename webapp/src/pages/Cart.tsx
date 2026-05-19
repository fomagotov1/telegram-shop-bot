import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import './Cart.css';

export default function Cart() {
  const navigate = useNavigate();
  const items = useCart((state) => state.items);
  const removeItem = useCart((state) => state.removeItem);
  const updateQuantity = useCart((state) => state.updateQuantity);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="cart cart-empty-state">
        <div className="cart-empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.25">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
        </div>
        <h2 className="cart-empty-title">Корзина пуста</h2>
        <p className="cart-empty-text">Добавьте товары из каталога</p>
        <button className="cart-go-to-shop" onClick={() => navigate('/')}>
          Перейти в каталог
        </button>
      </div>
    );
  }

  return (
    <div className="cart">
      <header className="cart-header">
        <h1 className="cart-title">Корзина</h1>
        <span className="cart-count">{totalItems} {totalItems === 1 ? 'товар' : 'товаров'}</span>
      </header>

      <div className="cart-items">
        {items.map((item) => (
          <div key={item.id} className="cart-item">
            <div className="cart-item-image">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} />
              ) : (
                <div className="cart-item-image-placeholder" />
              )}
            </div>
            <div className="cart-item-info">
              <h3 className="cart-item-name">{item.name}</h3>
              <p className="cart-item-price">${item.price.toFixed(2)}</p>
            </div>
            <div className="cart-item-actions">
              <div className="quantity-control">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
              <button className="cart-item-remove" onClick={() => removeItem(item.id)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-footer">
        <div className="cart-total">
          <span>Итого</span>
          <span className="cart-total-amount">${totalPrice.toFixed(2)}</span>
        </div>
        <button className="cart-checkout-btn" onClick={() => navigate('/checkout')}>
          Оплатить
        </button>
      </div>
    </div>
  );
}
