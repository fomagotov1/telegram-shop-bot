import { Request, Response } from 'express';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import {
  CryptoCurrency,
  getSupportedCurrencies,
  getPaymentDetails,
  generateMemo,
} from '../services/crypto';

const RATES: Record<string, number> = {
  TON: 2.5,
  USDT_TRC20: 1,
  USDT_ERC20: 1,
  ETH: 2500,
  BTC: 65000,
};

export const orderController = {
  async create(req: Request, res: Response) {
    try {
      const { telegram_user_id, telegram_username, items, total_amount, currency, crypto_currency } = req.body;

      const id = uuidv4();
      const selectedCurrency: CryptoCurrency = (crypto_currency || 'TON') as CryptoCurrency;
      const rate = RATES[selectedCurrency] || 1;
      const cryptoAmount = (total_amount / rate).toFixed(selectedCurrency === 'BTC' ? 8 : 6);

      const paymentDetails = getPaymentDetails(selectedCurrency, id, total_amount);
      if (!paymentDetails) {
        res.status(400).json({ error: 'Unsupported currency' });
        return;
      }

      db.prepare(`
        INSERT INTO orders (id, telegram_user_id, telegram_username, items, total_amount, currency, status, crypto_currency)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
      `).run(id, telegram_user_id, telegram_username, JSON.stringify(items), total_amount, currency || 'USD', selectedCurrency);

      res.status(201).json({
        order_id: id,
        ...paymentDetails,
        crypto_amount: cryptoAmount,
        usd_amount: total_amount,
        rate,
      });
    } catch (error: any) {
      console.error('Order creation error:', error);
      res.status(500).json({ error: error.message || 'Failed to create order' });
    }
  },

  getSupportedCurrencies(req: Request, res: Response) {
    res.json({ currencies: getSupportedCurrencies() });
  },

  getById(req: Request, res: Response) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(order);
  },

  getByUser(req: Request, res: Response) {
    const orders = db.prepare('SELECT * FROM orders WHERE telegram_user_id = ? ORDER BY created_at DESC').all(req.params.telegramId);
    res.json(orders);
  },
};
