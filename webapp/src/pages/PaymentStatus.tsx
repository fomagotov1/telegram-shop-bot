import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './PaymentStatus.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://backend-production-e853.up.railway.app/api';

const CRYPTO_ICONS: Record<string, string> = {
  TON: 'https://cryptologos.cc/logos/toncoin-ton-logo.png',
  USDT_TRC20: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
  USDT_ERC20: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
  ETH: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  BTC: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
};

export default function PaymentStatus() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'pending' | 'paid' | 'expired' | 'cancelled'>('pending');
  const [copied, setCopied] = useState<'address' | 'memo' | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [checkState, setCheckState] = useState<'idle' | 'checking' | 'notfound' | 'found'>('idle');
  const [paymentData, setPaymentData] = useState<any>({
    wallet_address: '', memo: '', crypto_amount: '', currency: 'TON', network: '',
  });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (location.state) {
      setPaymentData(location.state);
    } else if (orderId) {
      axios.get(`${API_URL}/orders/${orderId}`).then((res) => {
        setPaymentData({
          wallet_address: res.data.wallet_address || '',
          memo: res.data.memo || '',
          crypto_amount: res.data.crypto_amount || '',
          currency: res.data.currency || 'TON',
          network: res.data.network || '',
          usd_amount: res.data.usd_amount,
          rub_amount: res.data.rub_amount,
          rate: res.data.rate,
          expires_at: res.data.expires_at,
          locations: res.data.locations || [],
        });
        if (res.data.status === 'cancelled') setStatus('cancelled');
        if (res.data.status === 'paid') setStatus('paid');
      }).catch(() => {});
    }
  }, [orderId, location.state]);

  const currency = paymentData.currency || 'TON';
  const currencyName = currency === 'USDT_TRC20' ? 'USDT' : currency === 'USDT_ERC20' ? 'USDT' : currency;
  const needsMemo = currency === 'TON';
  const cryptoIcon = CRYPTO_ICONS[currency] || '';
  const qrUrl = paymentData.wallet_address ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(paymentData.wallet_address)}` : '';

  useEffect(() => {
    if (!paymentData.expires_at) return;
    const expiresAt = new Date(paymentData.expires_at).getTime();
    const updateTimer = () => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        setTimeLeft(0);
        setStatus('expired');
        if (timerRef.current) clearInterval(timerRef.current);
        if (pollRef.current) clearInterval(pollRef.current);
      } else {
        setTimeLeft(Math.floor(remaining / 1000));
      }
    };
    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paymentData.expires_at]);

  useEffect(() => {
    if (!orderId || status !== 'pending') return;
    pollRef.current = setInterval(async () => {
      try {
        const checkRes = await axios.post(`${API_URL}/payments/check/${orderId}`);
        if (checkRes.data.status === 'paid') {
          setPaymentData((prev: any) => ({ ...prev, locations: checkRes.data.locations || [] }));
          setStatus('paid');
          setCheckState('found');
          if (pollRef.current) clearInterval(pollRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
        } else if (checkRes.data.status === 'expired') {
          setStatus('expired');
          if (pollRef.current) clearInterval(pollRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
        }
      } catch (e) { console.error('Poll error:', e); }
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [orderId, status]);

  async function handleManualCheck() {
    if (!orderId) return;
    setCheckState('checking');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const checkRes = await axios.post(`${API_URL}/payments/check/${orderId}`);
      if (checkRes.data.status === 'paid') {
        setPaymentData((prev: any) => ({ ...prev, locations: checkRes.data.locations || [] }));
        setCheckState('found');
        setStatus('paid');
        if (pollRef.current) clearInterval(pollRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
      } else if (checkRes.data.status === 'expired') {
        setCheckState('notfound');
        setStatus('expired');
        if (pollRef.current) clearInterval(pollRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setCheckState('notfound');
      }
    } catch (e) {
      console.error('Manual check error:', e);
      setCheckState('notfound');
    }
  }

  async function handleCancel() {
    if (!orderId) return;
    setCancelling(true);
    try {
      await axios.post(`${API_URL}/orders/${orderId}/cancel`);
      setStatus('cancelled');
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    } catch (e) {
      console.error('Cancel error:', e);
    } finally {
      setCancelling(false);
    }
  }

  function copyToClipboard(text: string, type: 'address' | 'memo') {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  const addressShort = paymentData.wallet_address
    ? `${paymentData.wallet_address.slice(0, 12)}...${paymentData.wallet_address.slice(-8)}` : '';

  if (status === 'paid') {
    return (
      <div className="payment-status payment-success">
        <div className="payment-success-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" /></svg>
        </div>
        <h1 className="payment-success-title neon-text">Оплата подтверждена</h1>
        <p className="payment-success-text">Ваш заказ оплачен. Координаты кладов выданы!</p>
        
        <div className="locations-delivery">
          {paymentData.locations?.map((loc: any, idx: number) => (
            <div key={loc.id} className="location-card glass-panel">
              <h3 className="location-title">Клад #{idx + 1}</h3>
              <div className="location-map">
                <iframe 
                  width="100%" 
                  height="200" 
                  frameBorder="0" 
                  style={{ border: 0, borderRadius: '12px' }}
                  src={`https://maps.google.com/maps?q=${loc.latitude},${loc.longitude}&z=15&output=embed`} 
                  allowFullScreen
                ></iframe>
              </div>
              <div className="location-coords">
                <code>{loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}</code>
                <button 
                  className="copy-coord-btn"
                  onClick={() => copyToClipboard(`${loc.latitude}, ${loc.longitude}`, 'memo')}
                >
                  {copied === 'memo' ? '✓' : 'Копировать'}
                </button>
              </div>
              <a 
                href={`https://yandex.ru/maps/?pt=${loc.longitude},${loc.latitude}&z=16&l=map`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="map-link-btn glass-panel"
              >
                Открыть в Яндекс.Картах
              </a>
            </div>
          ))}
        </div>

        <button className="payment-success-btn glass-panel neon-text" onClick={() => navigate('/')}>Вернуться в каталог</button>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="payment-status payment-expired">
        <div className="payment-expired-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
        </div>
        <h1 className="payment-expired-title">Оплата отменена</h1>
        <button className="payment-expired-btn" onClick={() => navigate('/')}>Вернуться в каталог</button>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="payment-status payment-expired">
        <div className="payment-expired-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
        </div>
        <h1 className="payment-expired-title">Время оплаты истекло</h1>
        <p className="payment-expired-text">Заказ не был оплачен в течение 15 минут.</p>
        <button className="payment-expired-btn" onClick={() => navigate('/support?order=' + orderId)}>Написать в поддержку</button>
        <button className="payment-success-btn" style={{ marginTop: 12 }} onClick={() => navigate('/')}>Вернуться в каталог</button>
      </div>
    );
  }

  return (
    <div className="payment-status">
      <header className="payment-header">
        <h1 className="payment-title">Оплата {currencyName}</h1>
      </header>

      <div className="payment-waiting">
        {timeLeft !== null && (
          <div className={`payment-timer ${timeLeft < 180 ? 'warning' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            <span>Осталось: {formatTime(timeLeft)}</span>
          </div>
        )}

        <div className="ton-amount-display">
          {cryptoIcon ? (
            <img src={cryptoIcon} alt="" className="crypto-icon-large" />
          ) : (
            <div className="ton-icon"><span className="currency-icon-large">💎</span></div>
          )}
          <span className="ton-amount-value">{paymentData.crypto_amount} {currencyName}</span>
        </div>

        {paymentData.rub_amount && paymentData.rate && paymentData.rate > 0 && (
          <p className="payment-usd-equiv">{paymentData.rub_amount.toLocaleString('ru-RU')} ₽ ≈ {paymentData.crypto_amount} {currencyName}</p>
        )}

        {qrUrl && (
          <div className="payment-qr">
            <img src={qrUrl} alt="QR" className="qr-image" />
          </div>
        )}

        <div className="payment-details">
          <div className="payment-detail-row">
            <label>Адрес кошелька</label>
            <div className="payment-detail-value" onClick={() => copyToClipboard(paymentData.wallet_address, 'address')}>
              <span>{addressShort}</span>
              <span className={`copy-label ${copied === 'address' ? 'visible' : ''}`}>{copied === 'address' ? '✓ Скопировано' : 'Копировать'}</span>
            </div>
          </div>
          {needsMemo && paymentData.memo && (
            <div className="payment-detail-row">
              <label>Комментарий (memo)</label>
              <div className="payment-detail-value" onClick={() => copyToClipboard(paymentData.memo!, 'memo')}>
                <span className="memo-text">{paymentData.memo}</span>
                <span className={`copy-label ${copied === 'memo' ? 'visible' : ''}`}>{copied === 'memo' ? '✓ Скопировано' : 'Копировать'}</span>
              </div>
            </div>
          )}
        </div>

        {checkState === 'checking' && (
          <div className="payment-checking">
            <div className="payment-spinner-small" />
            <span>Подождите, проверяем платеж...</span>
            <p className="payment-checking-hint">Это может занять до 5 минут</p>
          </div>
        )}

        {checkState === 'notfound' && (
          <div className="payment-checking payment-checking-error">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
            <span>Платёж не найден</span>
            <p className="payment-checking-hint">Убедитесь, что вы отправили точную сумму на указанный адрес</p>
          </div>
        )}

        {checkState === 'idle' && (
          <>
            <div className="payment-spinner-row">
              <div className="payment-spinner-small" />
              <span>Ожидание оплаты...</span>
            </div>

            <button className="payment-i-paid-btn" onClick={handleManualCheck}>
              Я оплатил
            </button>
          </>
        )}

        {checkState === 'notfound' && (
          <button className="payment-i-paid-btn" onClick={handleManualCheck}>
            Проверить снова
          </button>
        )}

        <div className="payment-actions">
          <button className="payment-cancel-btn" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? 'Отмена...' : 'Отменить оплату'}
          </button>
          <button className="payment-support-btn" onClick={() => navigate('/support?order=' + orderId)}>
            Проблема с оплатой?
          </button>
        </div>
      </div>
    </div>
  );
}