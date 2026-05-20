# Настройка Cloudflare для Shop Bot

## Шаг 1: Установи wrangler CLI
```bash
npm install -g wrangler
```

## Шаг 2: Авторизуйся в Cloudflare
```bash
wrangler login
```

## Шаг 3: Создай D1 базу данных
```bash
wrangler d1 create shop-db
```
Скопируй `database_id` из вывода и вставь в `backend-cf/wrangler.toml`.

## Шаг 4: Создай R2 бакет
```bash
wrangler r2 bucket create shop-uploads
```

## Шаг 5: Примени миграции
```bash
cd backend-cf
npm install
npm run db:migrate:prod
```

## Шаг 6: Заполни секреты
```bash
wrangler secret put BOT_TOKEN
wrangler secret put ADMIN_TELEGRAM_ID
wrangler secret put SERVER_URL
wrangler secret put MNEMONIC_SEED
wrangler secret put WALLET_ADDRESS_TON
```

## Шаг 7: Задеплой бэкенд
```bash
npm run deploy
```
Скопируй URL воркера из вывода (например: `https://shop-bot-backend.username.workers.dev`)

## Шаг 8: Обнови переменные
- В `webapp/.env.production` замени API_URL на URL воркера
- В Railway (если ещё используется) обнови `SERVER_URL`

## Шаг 9: Задеплой фронтенд на Cloudflare Pages
```bash
cd ..
wrangler pages deploy webapp/dist --project-name=telegram-shop-bot
```

## Шаг 10: Настрой бота
- В @BotFather обнови Menu Button URL на новый Cloudflare Pages URL
- В `backend-cf/wrangler.toml` обнови `SERVER_URL` на Cloudflare Pages URL
- Перезадеплой бэкенд: `cd backend-cf && npm run deploy`

## Готово! 🎉

Теперь всё работает на Cloudflare:
- Фронтенд: Cloudflare Pages (бесплатно)
- Бэкенд: Cloudflare Workers (бесплатно до 100k запросов/день)
- БД: Cloudflare D1 (бесплатно до 5GB)
- Файлы: Cloudflare R2 (бесплатно до 10GB)
