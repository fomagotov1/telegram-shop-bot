import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../hooks/useCart';
import type { CurrencyInfo } from '../types';
import './Checkout.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://backend-production-e853.up.railway.app/api';

const RUB_TO_USD_RATE = 0.011;

const CRYPTO_ICONS: Record<string, string> = {
  TON: 'https://cryptologos.cc/logos/toncoin-ton-logo.png',
  USDT_TRC20: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
  USDT_ERC20: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
  ETH: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  BTC: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
};

export default function Checkout() {
  const navigate = useNavigate();
  const items = useCart((state) => state.items);
  const [loading, setLoading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('TON');
  const [availableCurrencies, setAvailableCurrencies] = useState<any[]>([]);
  const [cryptoAmount, setCryptoAmount] = useState('0');

  const totalPriceRub = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalPriceUsd = +(totalPriceRub * RUB_TO_USD_RATE).toFixed(2);

  useEffect(() => { fetchCurrencies(); }, []);

  useEffect(() => {
    if (availableCurrencies.length > 0 && !availableCurrencies.find((c: any) => c.currency === selectedCurrency)) {
      setSelectedCurrency(availableCurrencies[0].currency);
    }
  }, [availableCurrencies]);

  useEffect(() => {
    const selected = availableCurrencies.find((c: any) => c.currency === selectedCurrency);
    if (selected && totalPriceUsd > 0) {
      const amount = totalPriceUsd / selected.rate;
      const decimals = selectedCurrency === 'BTC' ? 8 : 6;
      setCryptoAmount(amount.toFixed(decimals));
    }
  }, [selectedCurrency, availableCurrencies, totalPriceUsd]);

  async function fetchCurrencies() {
    try {
      const res = await axios.get(`${API_URL}/orders/currencies`);
      const currencies = res.data.currencies.map((c: CurrencyInfo) => ({
        currency: c.currency,
        name: c.currency === 'TON' ? 'TON' : c.currency === 'USDT_TRC20' ? 'USDT (TRC-20)' : c.currency === 'USDT_ERC20' ? 'USDT (ERC-20)' : c.currency === 'ETH' ? 'Ethereum' : 'Bitcoin',
        network: c.currency === 'TON' ? 'TON Network' : c.currency === 'USDT_TRC20' ? 'TRON' : c.currency === 'USDT_ERC20' ? 'Ethereum' : c.currency === 'ETH' ? 'Ethereum' : 'Bitcoin',
        icon: CRYPTO_ICONS[c.currency] || '',
        rate: c.rate || 1,
      }));
      setAvailableCurrencies(currencies);
    } catch (e) {
      console.error('Failed to fetch currencies:', e);
      setAvailableCurrencies([
        { currency: 'TON', name: 'TON', network: 'TON Network', icon: CRYPTO_ICONS.TON, rate: 2.5 },
      ]);
    }
  }

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  async function handlePay() {
    const telegramUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    if (!telegramUserId) {
      window.Telegram?.WebApp?.showAlert?.('Это приложение работает только внутри Telegram.');
      return;
    }

    const confirmMsg = `Вы уверены, что хотите оплатить ${totalPriceRub.toLocaleString('ru-RU')} ₽ через ${selectedCurrency}?`;
    const confirmed = await new Promise<boolean>((resolve) => {
      if (window.Telegram?.WebApp?.showConfirm) {
        window.Telegram.WebApp.showConfirm(confirmMsg, resolve);
      } else {
        resolve(window.confirm(confirmMsg));
      }
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/orders`, {
        telegram_user_id: telegramUserId,
        telegram_username: window.Telegram?.WebApp?.initDataUnsafe?.user?.username,
        items: items.map((item) => ({
          id: item.id, name: item.name, price: item.price, quantity: item.quantity,
        })),
        total_amount: totalPriceUsd,
        currency: 'USD',
        crypto_currency: selectedCurrency,
      });

      navigate(`/payment/${res.data.order_id}`, {
        state: {
          wallet_address: res.data.address || res.data.wallet_address || '',
          memo: res.data.memo || '',
          crypto_amount: res.data.crypto_amount || '',
          currency: res.data.currency || 'TON',
          network: res.data.network || '',
          usd_amount: res.data.usd_amount || 0,
          rub_amount: totalPriceRub,
          rate: res.data.rate || 1,
          expires_at: res.data.expires_at || '',
        },
      });
    } catch (e: any) {
      console.error('Checkout error:', e);
      const msg = e?.response?.data?.error || 'Ошибка при создании заказа. Попробуйте снова.';
      window.Telegram?.WebApp?.showAlert?.(msg);
    } finally {
      setLoading(false);
    }
  }

  const selectedInfo = availableCurrencies.find((c: any) => c.currency === selectedCurrency) || availableCurrencies[0];

  return (
    <div className="checkout">
      <header className="checkout-header">
        <button className="checkout-back" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <h1 className="checkout-title">Оплата</h1>
        <div style={{ width: 20 }} />
      </header>

      <div className="checkout-items">
        {items.map((item) => (
          <div key={item.id} className="checkout-item">
            <div className="checkout-item-info">
              <h3>{item.name}</h3>
              <p>× {item.quantity}</p>
            </div>
            <span className="checkout-item-total">{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</span>
          </div>
        ))}
      </div>

      <div className="checkout-summary">
        <div className="checkout-summary-row">
          <span>К оплате</span>
          <span className="checkout-total">{totalPriceRub.toLocaleString('ru-RU')} ₽</span>
        </div>
      </div>

      <div className="currency-selector">
        <label className="currency-label">Выберите криптовалюту</label>
        <div className="currency-options">
          {availableCurrencies.map((currency: any) => {
            const isSelected = selectedCurrency === currency.currency;
            return (
              <button
                key={currency.currency}
                className={`currency-option ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedCurrency(currency.currency)}
              >
                {currency.icon ? (
                  <img src={currency.icon} alt="" className="currency-img" />
                ) : (
                  <span className="currency-icon">{currency.icon}</span>
                )}
                <div className="currency-info">
                  <span className="currency-name">{currency.name}</span>
                  <span className="currency-network">{currency.network}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <p className="payment-note">После нажатия «Оплатить» вы получите адрес кошелька для перевода.<br />Заказ действителен 15 минут.</p>

      <button className="checkout-pay-btn" onClick={handlePay} disabled={loading}>
        {loading ? <span className="spinner" /> : `Оплатить ${totalPriceRub.toLocaleString('ru-RU')} ₽`}
      </button>
    </div>
  );
}