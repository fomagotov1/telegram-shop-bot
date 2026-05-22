import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './History.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://backend-production-e853.up.railway.app/api';

export default function History() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const telegramUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    if (!telegramUserId) {
      setLoading(false);
      return;
    }

    axios.get(`${API_URL}/orders/user/${telegramUserId}`)
      .then(res => setOrders(res.data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="history">
      <header className="history-header">
        <h1 className="history-title neon-text">История покупок</h1>
      </header>

      {loading ? (
        <div className="history-loading">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      ) : orders.length === 0 ? (
        <div className="history-empty">
          <p>У вас еще нет заказов.</p>
          <button onClick={() => navigate('/')} className="glass-panel neon-text go-catalog-btn">В каталог</button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order, i) => (
            <div 
              key={order.id} 
              className="order-card glass-panel animate-slide-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="order-card-header">
                <h3>Заказ #{order.id.slice(0, 8)}</h3>
                <span className={`order-status ${order.status}`}>
                  {order.status === 'paid' ? 'Оплачен' : order.status === 'pending' ? 'Ожидает оплаты' : 'Отменен'}
                </span>
              </div>
              <p className="order-date">{new Date(order.created_at).toLocaleString('ru-RU')}</p>
              
              <div className="order-items">
                {JSON.parse(order.items).map((item: any, idx: number) => (
                  <div key={idx} className="order-item">
                    <span className="order-item-name">{item.name}</span>
                    <span className="order-item-qty">{item.quantity} шт.</span>
                  </div>
                ))}
              </div>

              <div className="order-total">
                <span>Итого:</span>
                <span className="neon-text">${order.total_amount.toFixed(2)}</span>
              </div>

              {order.status === 'paid' && order.locations && order.locations.length > 0 && (
                <div className="order-locations">
                  <h4 className="locations-heading">Выданные клады:</h4>
                  {order.locations.map((loc: any, idx: number) => (
                    <div key={loc.id} className="history-location-item">
                      <div className="loc-header">Клад #{idx + 1}</div>
                      <code>{loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}</code>
                      <a 
                        href={`https://yandex.ru/maps/?pt=${loc.longitude},${loc.latitude}&z=16&l=map`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="map-link-btn glass-panel"
                        style={{ marginTop: 8 }}
                      >
                        Показать на карте
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
