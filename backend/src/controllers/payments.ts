import { Request, Response } from 'express';
import { db } from '../db';
import { checkPayment, CryptoCurrency } from '../services/crypto';
import { getCryptoRate } from '../services/rates';
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

      const orderData = order as any;

      if (orderData.status === 'paid') {
        res.json({ status: 'paid', order });
        return;
      }

      if (orderData.status === 'expired') {
        res.json({ status: 'expired', order });
        return;
      }

      if (orderData.expires_at && new Date(orderData.expires_at) < new Date()) {
        db.prepare(`
          UPDATE orders
          SET status = 'expired', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(orderId);

        res.json({ status: 'expired', order: { ...orderData, status: 'expired' } });
        return;
      }

      const cryptoCurrency = orderData.crypto_currency || 'TON';
      const rate = await getCryptoRate(cryptoCurrency);
      const expectedAmount = orderData.total_amount / rate;

      const payment = await checkPayment(
        orderId,
        cryptoCurrency as CryptoCurrency,
        expectedAmount,
        orderData.created_at,
        orderData.deposit_address
      );

      if (payment.paid) {
        const existingPaidOrder = db.prepare(`
          SELECT id FROM orders
          WHERE payment_id = ? AND id != ? AND status = 'paid'
        `).get(payment.txHash || 'confirmed', orderId);

        if (existingPaidOrder) {
          console.log(`Duplicate payment detected: txHash ${payment.txHash} already used for order ${(existingPaidOrder as any).id}`);
          res.json({ status: 'pending', order });
          return;
        }

        db.prepare(`
          UPDATE orders
          SET status = 'paid', payment_id = ?, paid_amount = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(payment.txHash || 'confirmed', payment.paidAmount || expectedAmount, orderId);

        const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
        if (updatedOrder) {
          try {
            await bot.telegram.sendMessage(
              (updatedOrder as any).telegram_user_id,
              `✅ Оплата подтверждена!\n\nЗаказ #${orderId.slice(0, 8)}\nСумма: ${payment.paidAmount?.toFixed(6)} ${cryptoCurrency}\nСпасибо за покупку!`
            );
          } catch (e) {
            console.error('Failed to notify user:', e);
          }
        }

        res.json({ status: 'paid', order: updatedOrder, txHash: payment.txHash, paidAmount: payment.paidAmount });
      } else {
        res.json({ status: 'pending', order });
      }
    } catch (error: any) {
      console.error('Check status error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async handleWebhook(req: Request, res: Response) {
    try {
      const payload = req.body;
      console.log('Webhook received:', JSON.stringify(payload));

      db.prepare(`
        INSERT INTO payment_webhooks (order_id, payload)
        VALUES (?, ?)
      `).run(payload.order_id || null, JSON.stringify(payload));

      if (payload.order_id && payload.status === 'paid') {
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(payload.order_id);
        if (order && (order as any).status === 'pending') {
          db.prepare(`
            UPDATE orders
            SET status = 'paid', payment_id = ?, paid_amount = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(payload.tx_hash || 'webhook_confirmed', payload.paid_amount || 0, payload.order_id);

          const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(payload.order_id);
          if (updatedOrder) {
            try {
              await bot.telegram.sendMessage(
                (updatedOrder as any).telegram_user_id,
                `✅ Оплата подтверждена (webhook)!\n\nЗаказ #${payload.order_id.slice(0, 8)}\nСпасибо за покупку!`
              );
            } catch (e) {
              console.error('Failed to notify user:', e);
            }
          }
        }
      }

      res.status(200).json({ status: 'ok' });
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: error.message });
    }
  },
};
