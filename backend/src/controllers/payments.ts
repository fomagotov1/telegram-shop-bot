import { Request, Response } from 'express';
import { db } from '../db';
import { checkPaymentStatus } from '../services/cryptomus';
import { bot } from '../bot';

export const paymentController = {
  async webhook(req: Request, res: Response) {
    try {
      db.prepare('INSERT INTO payment_webhooks (order_id, payload) VALUES (?, ?)').run(
        req.body?.order_id || null,
        JSON.stringify(req.body)
      );

      const { order_id, status, amount } = req.body;

      if (status === 'paid' || status === 'received') {
        db.prepare(`
          UPDATE orders
          SET status = 'paid', paid_amount = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(amount, order_id);

        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
        if (order) {
          try {
            await bot.telegram.sendMessage(
              (order as any).telegram_user_id,
              `✅ Оплата подтверждена!\n\nЗаказ #${order_id}\nСумма: ${amount} USD\n\nСпасибо за покупку!`
            );
          } catch (e) {
            console.error('Failed to notify user:', e);
          }
        }
      }

      res.json({ result: true });
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async checkStatus(req: Request, res: Response) {
    try {
      const { orderId } = req.params;

      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      if ((order as any).status === 'paid') {
        res.json({ status: 'paid', order });
        return;
      }

      const paymentId = (order as any).payment_id;
      if (!paymentId) {
        res.json({ status: (order as any).status, order });
        return;
      }

      const paymentInfo = await checkPaymentStatus(paymentId);

      if (paymentInfo.status === 'paid' || paymentInfo.status === 'received') {
        db.prepare(`
          UPDATE orders
          SET status = 'paid', paid_amount = ?, crypto_currency = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(paymentInfo.paid_amount, paymentInfo.currency, orderId);

        res.json({ status: 'paid', order: { ...(order as any), status: 'paid', paid_amount: paymentInfo.paid_amount } });
      } else {
        res.json({ status: paymentInfo.status, order });
      }
    } catch (error: any) {
      console.error('Check status error:', error);
      res.status(500).json({ error: error.message });
    }
  },
};
