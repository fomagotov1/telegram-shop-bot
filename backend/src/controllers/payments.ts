import { Request, Response } from 'express';
import { db } from '../db';
import { checkTonPayment } from '../services/ton';
import { bot } from '../bot';

export const paymentController = {
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

      const payment = await checkTonPayment(orderId, (order as any).total_amount);

      if (payment.paid) {
        db.prepare(`
          UPDATE orders
          SET status = 'paid', payment_id = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(payment.txHash || 'confirmed', orderId);

        const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
        if (updatedOrder) {
          try {
            await bot.telegram.sendMessage(
              (updatedOrder as any).telegram_user_id,
              `✅ Оплата подтверждена!\n\nЗаказ #${orderId}\nСпасибо за покупку!`
            );
          } catch (e) {
            console.error('Failed to notify user:', e);
          }
        }

        res.json({ status: 'paid', order: updatedOrder });
      } else {
        res.json({ status: 'pending', order });
      }
    } catch (error: any) {
      console.error('Check status error:', error);
      res.status(500).json({ error: error.message });
    }
  },
};
