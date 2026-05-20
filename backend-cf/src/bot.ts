import { Bot } from 'grammy';
import { Hono } from 'hono';

export function setupBot(app: Hono<{ Bindings: Env }>, botToken: string, serverUrl: string) {
  const bot = new Bot(botToken);

  bot.command('start', (ctx) => {
    ctx.reply(
      'Добро пожаловать в наш магазин!\n\nВыбирайте товары, оплачивайте криптой - все просто.',
      {
        reply_markup: {
          inline_keyboard: [[{
            text: 'Открыть магазин',
            web_app: { url: serverUrl },
          }]],
        },
      }
    );
  });

  bot.command('shop', (ctx) => {
    ctx.reply(
      'Откройте наш магазин:',
      {
        reply_markup: {
          inline_keyboard: [[{
            text: 'Каталог товаров',
            web_app: { url: serverUrl },
          }]],
        },
      }
    );
  });

  bot.command('admin', (ctx) => {
    const adminId = parseInt(process.env.ADMIN_TELEGRAM_ID || '0');
    if (ctx.from?.id !== adminId) {
      ctx.reply('Доступ запрещен');
      return;
    }
    ctx.reply(
      'Админ-панель:',
      {
        reply_markup: {
          inline_keyboard: [[{
            text: 'Управление товарами',
            web_app: { url: `${serverUrl}/admin` },
          }]],
        },
      }
    );
  });

  app.all('/webhook', async (c) => {
    const update = await c.req.json();
    await bot.handleUpdate(update);
    return c.json({ ok: true });
  });

  return bot;
}
