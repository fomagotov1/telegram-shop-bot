import { Bot } from 'grammy';
import { Hono } from 'hono';
import { Database } from './services/database';

let botInstance: Bot | null = null;

async function getBot(env: Env): Promise<Bot> {
  if (botInstance) return botInstance;

  const bot = new Bot(env.BOT_TOKEN);
  const serverUrl = env.SERVER_URL;
  const adminId = parseInt(env.ADMIN_TELEGRAM_ID || '0');
  const db = env.DB as D1Database;
  const database = new Database(db);

  function isAdmin(ctx: any): boolean {
    return ctx.from?.id === adminId;
  }

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
    if (!isAdmin(ctx)) { ctx.reply('Доступ запрещен'); return; }
    ctx.reply(
      'Админ-панель:\n\n' +
      '/addproduct - Добавить товар\n' +
      '/editproduct - Редактировать товар\n' +
      '/deleteproduct - Удалить товар\n' +
      '/listproducts - Список товаров\n' +
      '/addmedia - Добавить медиа к товару\n',
      { reply_markup: { inline_keyboard: [[{ text: 'Управление товарами', web_app: { url: `${serverUrl}/admin` } }]] } }
    );
  });

  const productSteps = new Map<number, { step: string; data: any }>();

  bot.command('addproduct', async (ctx) => {
    if (!isAdmin(ctx)) { ctx.reply('Доступ запрещен'); return; }
    productSteps.set(ctx.from!.id, { step: 'name', data: {} });
    ctx.reply('Введите название товара:');
  });

  bot.command('editproduct', async (ctx) => {
    if (!isAdmin(ctx)) { ctx.reply('Доступ запрещен'); return; }
    try {
      const products = await database.getAllProducts();
      if (products.length === 0) { ctx.reply('Нет товаров для редактирования.'); return; }
      const lines = products.map((p, i) => `${i + 1}. ${p.name} — ${p.price} ₽`).join('\n');
      productSteps.set(ctx.from!.id, { step: 'select_edit', data: { products } });
      ctx.reply(`Выберите номер товара для редактирования:\n\n${lines}`);
    } catch (e) {
      ctx.reply('Ошибка получения списка товаров.');
    }
  });

  bot.command('deleteproduct', async (ctx) => {
    if (!isAdmin(ctx)) { ctx.reply('Доступ запрещен'); return; }
    try {
      const products = await database.getAllProducts();
      if (products.length === 0) { ctx.reply('Нет товаров для удаления.'); return; }
      const lines = products.map((p, i) => `${i + 1}. ${p.name} — ${p.price} ₽`).join('\n');
      productSteps.set(ctx.from!.id, { step: 'select_delete', data: { products } });
      ctx.reply(`Выберите номер товара для удаления:\n\n${lines}`);
    } catch (e) {
      ctx.reply('Ошибка получения списка товаров.');
    }
  });

  bot.command('listproducts', async (ctx) => {
    if (!isAdmin(ctx)) { ctx.reply('Доступ запрещен'); return; }
    try {
      const products = await database.getAllProducts();
      if (products.length === 0) { ctx.reply('Товаров нет.'); return; }
      const lines = products.map((p) => `• ${p.name} — ${p.price} ₽${p.image_url ? ' 📷' : ''}`).join('\n');
      ctx.reply(`📦 Товары (${products.length}):\n\n${lines}`);
    } catch (e) {
      ctx.reply('Ошибка получения списка товаров.');
    }
  });

  bot.command('addmedia', async (ctx) => {
    if (!isAdmin(ctx)) { ctx.reply('Доступ запрещен'); return; }
    try {
      const products = await database.getAllProducts();
      if (products.length === 0) { ctx.reply('Нет товаров.'); return; }
      const lines = products.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
      productSteps.set(ctx.from!.id, { step: 'select_media_product', data: { products } });
      ctx.reply(`Выберите номер товара для добавления медиа:\n\n${lines}\n\nЗатем отправьте фото или видео.`);
    } catch (e) {
      ctx.reply('Ошибка получения списка товаров.');
    }
  });

  bot.on('message:text', async (ctx) => {
    if (!isAdmin(ctx)) return;
    const state = productSteps.get(ctx.from!.id);
    if (!state) return;

    const text = ctx.message.text;

    if (state.step === 'name') {
      state.data.name = text;
      state.step = 'price';
      ctx.reply('Введите цену (в рублях, только число):');
    } else if (state.step === 'price') {
      const price = parseFloat(text);
      if (isNaN(price) || price <= 0) { ctx.reply('Некорректная цена. Введите число больше 0:'); return; }
      state.data.price = price;
      state.step = 'description';
      ctx.reply('Введите описание товара (или отправьте "-" для пропуска):');
    } else if (state.step === 'description') {
      state.data.description = text === '-' ? '' : text;
      state.step = 'image';
      ctx.reply('Отправьте фото товара (или отправьте "-" для пропуска):');
    } else if (state.step === 'image') {
      if (text === '-') {
        state.data.image_url = '';
      } else {
        state.data.image_url = text;
      }
      state.step = 'category';
      ctx.reply('Введите категорию товара (или отправьте "-" для пропуска):');
    } else if (state.step === 'category') {
      state.data.category = text === '-' ? '' : text;
      try {
        const product = await database.createProduct({
          name: state.data.name,
          description: state.data.description || null,
          price: state.data.price,
          currency: 'RUB',
          image_url: state.data.image_url || null,
          category: state.data.category || null,
          stock: 100,
        });
        productSteps.delete(ctx.from!.id);
        ctx.reply(`✅ Товар добавлен!\n\n${product.name} — ${product.price} ₽`);
      } catch (e) {
        ctx.reply('❌ Ошибка при создании товара.');
      }
    } else if (state.step === 'select_edit') {
      const idx = parseInt(text) - 1;
      if (isNaN(idx) || idx < 0 || idx >= state.data.products.length) { ctx.reply('Неверный номер. Попробуйте снова.'); return; }
      state.data.selected = state.data.products[idx];
      state.step = 'edit_field';
      ctx.reply(
        `Редактирование: ${state.data.selected.name}\n\n` +
        `Что изменить?\n1 - Название\n2 - Цена\n3 - Описание\n4 - Категория\n5 - Отмена`
      );
    } else if (state.step === 'edit_field') {
      const choice = text.trim();
      const product = state.data.selected;
      if (choice === '5') { productSteps.delete(ctx.from!.id); ctx.reply('Отменено.'); return; }
      const fieldMap: any = { '1': 'name', '2': 'price', '3': 'description', '4': 'category' };
      const field = fieldMap[choice];
      if (!field) { ctx.reply('Неверный выбор. Попробуйте снова.'); return; }
      state.data.editField = field;
      state.step = 'edit_value';
      ctx.reply(`Введите новое значение для "${field}":`);
    } else if (state.step === 'edit_value') {
      const field = state.data.editField;
      const product = state.data.selected;
      const updateData: any = {};
      updateData[field] = field === 'price' ? parseFloat(text) : text;
      if (field === 'price' && (isNaN(updateData.price) || updateData.price <= 0)) {
        ctx.reply('Некорректная цена. Введите число больше 0:'); return;
      }
      try {
        await database.updateProduct(product.id, updateData);
        productSteps.delete(ctx.from!.id);
        ctx.reply(`✅ "${product.name}" обновлен!`);
      } catch (e) {
        ctx.reply('❌ Ошибка обновления.');
      }
    } else if (state.step === 'select_delete') {
      const idx = parseInt(text) - 1;
      if (isNaN(idx) || idx < 0 || idx >= state.data.products.length) { ctx.reply('Неверный номер.'); return; }
      const product = state.data.products[idx];
      try {
        await database.deleteProduct(product.id);
        productSteps.delete(ctx.from!.id);
        ctx.reply(`✅ "${product.name}" удален!`);
      } catch (e) {
        ctx.reply('❌ Ошибка удаления.');
      }
    } else if (state.step === 'select_media_product') {
      const idx = parseInt(text) - 1;
      if (isNaN(idx) || idx < 0 || idx >= state.data.products.length) { ctx.reply('Неверный номер.'); return; }
      state.data.selectedProduct = state.data.products[idx];
      state.step = 'waiting_media_file';
      ctx.reply(`Отправьте фото или видео для товара "${state.data.selectedProduct.name}":`);
    }
  });

  bot.on('message:photo', async (ctx) => {
    if (!isAdmin(ctx)) return;
    const state = productSteps.get(ctx.from!.id);
    if (!state) return;

    if (state.step === 'image') {
      const photo = ctx.message.photo!.pop()!;
      const file = await ctx.api.getFile(photo.file_id);
      state.data.image_url = file.file_id;
      state.step = 'category';
      ctx.reply('Введите категорию товара (или отправьте "-" для пропуска):');
    } else if (state.step === 'waiting_media_file') {
      try {
        const photo = ctx.message.photo!.pop()!;
        const file = await ctx.api.getFile(photo.file_id);
        const fileUrl = `https://api.telegram.org/file/bot${env.BOT_TOKEN}/${file.file_path}`;
        await database.addProductMedia({
          product_id: state.data.selectedProduct.id,
          url: fileUrl,
          type: 'image',
          sort_order: 0,
        });
        productSteps.delete(ctx.from!.id);
        ctx.reply(`✅ Медиа добавлено к "${state.data.selectedProduct.name}"!`);
      } catch (e) {
        ctx.reply('❌ Ошибка при добавлении медиа.');
      }
    }
  });

  bot.on('message:video', async (ctx) => {
    if (!isAdmin(ctx)) return;
    const state = productSteps.get(ctx.from!.id);
    if (!state || state.step !== 'waiting_media_file') return;
    try {
      const video = ctx.message.video!;
      const file = await ctx.api.getFile(video.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${env.BOT_TOKEN}/${file.file_path}`;
      await database.addProductMedia({
        product_id: state.data.selectedProduct.id,
        url: fileUrl,
        type: 'video',
        sort_order: 0,
      });
      productSteps.delete(ctx.from!.id);
      ctx.reply(`✅ Видео добавлено к "${state.data.selectedProduct.name}"!`);
    } catch (e) {
      ctx.reply('❌ Ошибка при добавлении видео.');
    }
  });

  await bot.init();
  botInstance = bot;
  return bot;
}

export function setupBot(app: Hono<{ Bindings: Env }>) {
  app.all('/webhook', async (c) => {
    try {
      const bot = await getBot(c.env);
      const update = await c.req.json();
      await bot.handleUpdate(update);
      return c.json({ ok: true });
    } catch (e: any) {
      return c.json({ ok: false, error: e?.message || 'unknown' }, 500);
    }
  });
}