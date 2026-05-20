# Shop Bot Backend - Cloudflare Workers

## Настройка

### 1. Установи wrangler CLI
```bash
npm install -g wrangler
```

### 2. Авторизуйся в Cloudflare
```bash
wrangler login
```

### 3. Создай D1 базу данных
```bash
wrangler d1 create shop-db
```
Скопируй `database_id` из вывода и вставь в `wrangler.toml`.

### 4. Создай R2 бакет
```bash
wrangler r2 bucket create shop-uploads
```

### 5. Примени миграции
```bash
npm run db:migrate
npm run db:migrate:prod
```

### 6. Заполни переменные окружения
```bash
wrangler secret put BOT_TOKEN
wrangler secret put ADMIN_TELEGRAM_ID
wrangler secret put SERVER_URL
wrangler secret put MNEMONIC_SEED
wrangler secret put WALLET_ADDRESS_TON
```

### 7. Запусти локально
```bash
npm run dev
```

### 8. Задеплой
```bash
npm run deploy
```

## Структура

```
backend-cf/
├── src/
│   ├── index.ts          # Точка входа (Hono)
│   ├── routes/
│   │   ├── products.ts   # CRUD товаров
│   │   ├── orders.ts     # Заказы
│   │   └── payments.ts   # Платежи
│   ├── services/
│   │   ├── crypto.ts     # Проверка платежей
│   │   ├── hd-wallet.ts  # HD Wallet
│   │   └── rates.ts      # Курсы
│   └── bot.ts            # Telegram бот (grammy)
├── drizzle/
│   └── migrate.sql       # Миграции D1
├── wrangler.toml         # Конфиг Cloudflare
── package.json

```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/products` - Список товаров
- `POST /api/products` - Создать товар
- `PUT /api/products/:id` - Обновить товар
- `DELETE /api/products/:id` - Удалить товар
- `POST /api/orders` - Создать заказ
- `GET /api/orders/:id` - Получить заказ
- `POST /api/payments/check/:orderId` - Проверить оплату

## Отличия от Railway версии

| Функция | Railway | Cloudflare |
|---------|---------|------------|
| Runtime | Node.js | Workers |
| Framework | Express | Hono |
| БД | SQLite | D1 (SQLite) |
| Файлы | Локально | R2 |
| Бот | Telegraf | Grammy |
| Деплой | railway CLI | wrangler |
