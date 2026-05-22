import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { Database } from '../services/database';
import { Bot } from 'grammy';

const router = new Hono<{ Bindings: Env }>();

const ticketSchema = z.object({
  telegram_user_id: z.number(),
  telegram_username: z.string().optional(),
  order_id: z.string().optional(),
  message: z.string().min(1),
});

router.post('/', zValidator('json', ticketSchema), async (c) => {
  const db = c.env.DB as D1Database;
  const database = new Database(db);
  const data = c.req.valid('json');

  const ticket = await database.createSupportTicket({
    order_id: data.order_id || null,
    telegram_user_id: data.telegram_user_id,
    telegram_username: data.telegram_username || null,
    message: data.message,
    status: 'open',
  });

  try {
    const bot = new Bot(c.env.BOT_TOKEN);
    const adminId = parseInt(c.env.ADMIN_TELEGRAM_ID || '0');
    const orderLine = data.order_id ? `\nЗаказ: ${data.order_id}` : '';
    await bot.api.sendMessage(adminId,
      `🆘 Новый тикет поддержки\n\n` +
      `ID: ${ticket.id}\n` +
      `Пользователь: ${data.telegram_username || '—'} (${data.telegram_user_id})${orderLine}\n` +
      `Сообщение: ${data.message}\n\n` +
      `Ответьте пользователю в личные сообщения.`
    );
  } catch (e) {
    console.error('Failed to notify admin:', e);
  }

  return c.json({
    ticket_id: ticket.id,
    message: 'Ваше обращение принято. Мы ответим вам в ближайшее время.',
  }, 201);
});

export { router as supportRouter };