import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';

dotenv.config();

const botToken = process.env.BOT_TOKEN;
export const bot = new Telegraf(botToken!);

const WEBAPP_URL = 'https://telegram-shop-bot.netlify.app';

bot.start((ctx) => {
  ctx.reply(
    '🛍️ Добро пожаловать в наш магазин!\n\nВыбирайте товары, оплачивайте TON — всё просто.',
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
