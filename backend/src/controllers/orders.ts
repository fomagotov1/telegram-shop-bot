import { Request, Response } from 'express';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { createPayment } from '../services/cryptomus';

export const orderController = {
  async create(req: Request, res: Response) {
    try {
      const { telegram_user_id, telegram_username, items, total_amount, currency } = req.body;

      const id = uuidv4();

      db.prepare(`
        INSERT INTO orders (id, telegram_user_id, telegram_username, items, total_amount, currency, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `).run(id, telegram_user_id, telegram_username, JSON.stringify(items), total_amount, currency || 'USD');

      const payment = await createPayment({
        order_id: id,
        amount: total_amount,
        currency: currency || 'USD',
      });

      db.prepare(`
        UPDATE orders SET payment_id = ?, payment_url = ?, crypto_currency = ?
        WHERE id = ?
      `).run(payment.uuid, payment.url, payment.currency, id);

      res.status(201).json({
        order_id: id,
        payment_id: payment.uuid,
        payment_url: payment.url,
        amount: total_amount,
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
