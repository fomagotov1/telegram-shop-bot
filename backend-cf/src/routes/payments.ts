import { Hono } from 'hono';
import { Database } from '../services/database';
import { checkPayment, getRate, CryptoCurrency } from '../services/crypto';
import { Bot } from 'grammy';

const router = new Hono<{ Bindings: Env }>();

router.post('/check/:orderId', async (c) => {
  const db = c.env.DB as D1Database;
  const database = new Database(db);
  const orderId = c.req.param('orderId');

  const order = await database.getOrderById(orderId);
  if (!order) return c.json({ error: 'Order not found' }, 404);

  if (order.status === 'paid') {
    return c.json({ status: 'paid', order });
  }

  const cryptoCurrency = order.crypto_currency as CryptoCurrency;
  const rate = getRate(cryptoCurrency);
  const expectedAmount = order.total_amount / rate;
  const walletAddress = c.env.WALLET_ADDRESS_TON || '';

  const payment = await checkPayment(orderId, cryptoCurrency, expectedAmount, walletAddress);

    if (payment.paid) {
      await database.updateOrderStatus(orderId, 'paid', payment.txHash || 'confirmed');
      const existingPayment = await database.getPaymentByOrderId(orderId);
      if (existingPayment) {
        await database.updatePaymentStatus(existingPayment.id, 'paid', payment.txHash);
      }
  
      await database.markOrderLocationsAsSold(orderId);
      const locations = await database.getOrderLocations(orderId);
  
      const updatedOrder = await database.getOrderById(orderId);
      
      try {
        const bot = new Bot(c.env.BOT_TOKEN);
        await bot.api.sendMessage(
          order.telegram_user_id,
          `✅ Оплата подтверждена!\n\nЗаказ #${orderId}\nСпасибо за покупку!\n\nВаши координаты ниже:`
        );
        for (const loc of locations) {
          await bot.api.sendLocation(order.telegram_user_id, loc.latitude, loc.longitude);
        }
      } catch (e) {
        console.error('Failed to notify user:', e);
      }
  
      return c.json({ status: 'paid', order: updatedOrder, locations });
    }

  return c.json({ status: 'pending', order });
});

router.post('/webhook', async (c) => {
  const body = await c.req.json();
  console.log('Webhook received:', body);
  return c.json({ received: true });
});

export { router as paymentRouter };
