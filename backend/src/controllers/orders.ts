import { Request, Response } from 'express';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { generateMemo, getWalletAddress, tonToNano } from '../services/ton';

const TON_USD_RATE = 2.5;

export const orderController = {
  async create(req: Request, res: Response) {
    try {
      const { telegram_user_id, telegram_username, items, total_amount, currency } = req.body;

      const id = uuidv4();
      const memo = generateMemo(id);
      const tonAmount = (total_amount / TON_USD_RATE).toFixed(4);
      const tonNano = tonToNano(parseFloat(tonAmount));
      const walletAddress = getWalletAddress();

      db.prepare(`
        INSERT INTO orders (id, telegram_user_id, telegram_username, items, total_amount, currency, status, crypto_currency)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', 'TON')
      `).run(id, telegram_user_id, telegram_username, JSON.stringify(items), total_amount, currency || 'USD');

      res.status(201).json({
        order_id: id,
        wallet_address: walletAddress,
        memo,
        ton_amount: tonAmount,
        ton_nano: tonNano,
        usd_amount: total_amount,
        ton_rate: TON_USD_RATE,
      });
    } catch (error: any) {
      console.error('Order creation error:', error);
      res.status(500).json({ error: error.message || 'Failed to create order' });
    }
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
