import { Request, Response } from 'express';
import { db } from '../db';
import { checkPayment, CryptoCurrency } from '../services/crypto';
import { bot } from '../bot';

const RATES: Record<string, number> = {
  TON: 2.5,
  USDT_TRC20: 1,
  USDT_ERC20: 1,
  ETH: 2500,
  BTC: 65000,
};

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

      const cryptoCurrency = (order as any).crypto_currency || 'TON';
      const rate = RATES[cryptoCurrency] || 1;
      const expectedAmount = (order as any).total_amount / rate;

      const payment = await checkPayment(orderId, cryptoCurrency as CryptoCurrency, expectedAmount);

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
