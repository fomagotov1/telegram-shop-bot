import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';

dotenv.config();

export const bot = new Telegraf(process.env.BOT_TOKEN!);

const WEBAPP_URL = process.env.SERVER_URL || 'https://your-domain.com';

bot.start((ctx) => {
  ctx.reply(
    '🛍️ Добро пожаловать в наш магазин!\n\nВыбирайте товары, оплачивайте криптой — всё просто.',
    Markup.inlineKeyboard([
      Markup.button.webApp('🛒 Открыть магазин', WEBAPP_URL),
    ])
  );
});

bot.command('shop', (ctx) => {
  ctx.reply(
    'Откройте наш магазин:',
    Markup.inlineKeyboard([
      Markup.button.webApp('🛒 Каталог товаров', WEBAPP_URL),
    ])
  );
});

bot.command('admin', (ctx) => {
  const adminId = parseInt(process.env.ADMIN_TELEGRAM_ID || '0');
  if (ctx.from?.id !== adminId) {
    ctx.reply('⛔ Доступ запрещён');
    return;
  }
  ctx.reply(
    '🔧 Админ-панель:',
    Markup.inlineKeyboard([
      Markup.button.webApp('📦 Управление товарами', `${WEBAPP_URL}/admin`),
    ])
  );
});
