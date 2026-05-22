import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './Support.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://backend-production-e853.up.railway.app/api';

export default function Support() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [orderId, setOrderId] = useState(searchParams.get('order') || '');

  async function handleSubmit() {
    if (!message.trim()) return;
    setSending(true);
    try {
      await axios.post(`${API_URL}/support`, {
        telegram_user_id: window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 0,
        telegram_username: window.Telegram?.WebApp?.initDataUnsafe?.user?.username,
        order_id: orderId || undefined,
        message: message.trim(),
      });
      setSent(true);
    } catch (e) {
      console.error('Support error:', e);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="support">
        <div className="support-success">
          <div className="support-success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <h2>Сообщение отправлено</h2>
          <p>Мы ответим вам в ближайшее время через Telegram.</p>
          <button className="support-btn" onClick={() => navigate('/')}>В каталог</button>
        </div>
      </div>
    );
  }

  return (
    <div className="support">
      <header className="support-header">
        <button className="support-back" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <h1>Техподдержка</h1>
        <div style={{ width: 20 }} />
      </header>

      <div className="support-form">
        <div className="support-field">
          <label>Номер заказа (если есть)</label>
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Например: 123e4567-..."
            className="support-input"
          />
        </div>

        <div className="support-field">
          <label>Опишите проблему</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Что случилось? Подробно опишите вашу проблему..."
            className="support-textarea"
            rows={5}
          />
        </div>

        <button className="support-btn" onClick={handleSubmit} disabled={sending || !message.trim()}>
          {sending ? 'Отправка...' : 'Отправить'}
        </button>
      </div>
    </div>
  );
}