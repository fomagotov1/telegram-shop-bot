# Telegram Shop Bot - Полная память проекта

> ️ **ВНИМАНИЕ**: Этот файл содержит секретные ключи и токены. Храните его в безопасном месте и НЕ коммитьте в git!

---

##  Общая информация

- **Название**: Telegram Shop Bot (Mini App)
- **Описание**: Магазин в Telegram с оплатой криптовалютой (TON, USDT, ETH, BTC)
- **Стек**: React + TS (Vite), Node.js + Express + Telegraf + SQLite
- **Дизайн**: Apple-стиль (минимализм, blur-эффекты, анимации)

---

##  Секретные ключи и токены

### Telegram Bot
- **Bot Token**: `8607044246:AAEx2a8DqBa9iEFDuCW_EJYz9qq6XYuUr4o`
- **Bot Username**: `@tgshoptextnext_bot`
- **Admin Telegram ID**: `640440627`

### Railway (Backend)
- **Railway Token**: `f97e55f5-52f9-4cbb-8dff-020ea2f86da7`
- **Project ID**: `ba9aed2c-33e9-4814-8fd5-33490ecac266`
- **Service ID (backend)**: `e08e0fe0-1391-4e2f-aca7-a333f2b2e520`
- **Environment ID**: `33df22f4-3f45-4631-8f7c-e89c405dfff4`

### Netlify (Frontend)
- **Netlify Token**: `nfp_iHNJvMp1Hfutwqi5fdCydKRWhgwurfte5f1e`
- **Site ID**: `20dd643d-8e97-4498-a65a-fe387a44094d`
- **Site Name**: `telegram-shop-bot`

### HD Wallet Seed Phrase
- **MNEMONIC_SEED**: `move fly rhythm relief vendor master indoor oxygen case pledge rotate exhibit`
- **MNEMONIC_SEED_B64**: `bW92ZSBmbHkgcmh5dGhtIHJlbGllZiB2ZW5kb3IgbWFzdGVyIGluZG9vciBveHlnZW4gY2FzZSBwbGVkZ2Ugcm90YXRlIGV4aGliaXQ=`
> ⚠️ **ВАЖНО**: Сохрани эту фразу в безопасном месте! Она нужна для доступа ко всем средствам.

### TON Wallet
- **WALLET_ADDRESS_TON**: `UQDvaWgrBSd4ic766co5pFUAIPxJfvQoQcRaUg3Y0UyzAg1K`

---

## 🌐 URL-адреса

### Продакшн
- **Frontend**: `https://telegram-shop-bot.netlify.app` ✅ Работает
- **Backend**: `https://backend-production-e853.up.railway.app` ⚠️ Требует рестарта
- **Health Check**: `https://backend-production-e853.up.railway.app/api/health`

### GitHub
- **Repository**: `https://github.com/fomagotov1/telegram-shop-bot.git`

---

## 🔐 Переменные окружения (Railway)

```env
# Основные
PORT=3000
BOT_TOKEN=8607044246:AAEx2a8DqBa9iEFDuCW_EJYz9qq6XYuUr4o
ADMIN_TELEGRAM_ID=640440627
SERVER_URL=https://backend-production-e853.up.railway.app

# HD Wallet Seed Phrase (12 слов)
MNEMONIC_SEED=move fly rhythm relief vendor master indoor oxygen case pledge rotate exhibit
MNEMONIC_SEED_B64=bW92ZSBmbHkgcmh5dGhtIHJlbGllZiB2ZW5kb3IgbWFzdGVyIGluZG9vciBveHlnZW4gY2FzZSBwbGVkZ2Ugcm90YXRlIGV4aGliaXQ=

# TON Wallet (общий адрес для TON платежей)
WALLET_ADDRESS_TON=UQDvaWgrBSd4ic766co5pFUAIPxJfvQoQcRaUg3Y0UyzAg1K

# API ключи (опционально)
ETHERSCAN_API_KEY=
```

---

##  Структура проекта

```
telegram-shop-bot/
── backend/                    # Node.js сервер
│   ├── src/
│   │   ├── index.ts           # Точка входа
│   │   ├── bot.ts             # Telegram бот
│   │   ├── db.ts              # SQLite база данных
│   │   ├── routes/            # API маршруты
│   │   ├── controllers/       # Контроллеры
│   │   ── services/
│   │       ├── crypto.ts      # Проверка платежей в блокчейне
│   │       ├── hd-wallet.ts   # HD Wallet генерация адресов
│   │       └── rates.ts       # Курсы криптовалют (CoinGecko)
│   ├── package.json
│   └── railway.json
│
├── webapp/                     # React фронтенд
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── pages/             # Страницы
│   │   ├── components/        # Компоненты
│   │   ├── hooks/             # Хуки
│   │   └── styles/            # Стили
│   ├── package.json
│   ├── netlify.toml
│   └── .env.production
│
└── PROJECT_MEMORY.md           # Этот файл
```

---

## 🚀 Команды для развёртывания

### Backend (Railway)
```powershell
$env:RAILWAY_TOKEN = "f97e55f5-52f9-4cbb-8dff-020ea2f86da7"
cd backend
railway up --ci --json --message "Deploy" --service e08e0fe0-1391-4e2f-aca7-a333f2b2e520
```

### Frontend (Netlify)
```powershell
$env:NETLIFY_AUTH_TOKEN = "nfp_iHNJvMp1Hfutwqi5fdCydKRWhgwurfte5f1e"
cd webapp
npm run build
npx netlify-cli deploy --prod --dir=dist --site=20dd643d-8e97-4498-a65a-fe387a44094d
```

---

## 💳 Поддерживаемые криптовалюты

| Валюта | Сеть | Уникальный адрес | Проверка | Статус |
|--------|------|------------------|----------|--------|
| TON | TON Network | ❌ Общий + Memo | tonapi.io | ✅ Работает |
| USDT | TRC-20 (TRON) | ✅ HD Wallet | trongrid.io |  Ждет рестарта |
| USDT | ERC-20 (Ethereum) | ✅ HD Wallet | etherscan.io |  Ждет рестарта |
| ETH | Ethereum | ✅ HD Wallet | etherscan.io | ⏳ Ждет рестарта |
| BTC | Bitcoin | ✅ HD Wallet | blockchain.info | ✅ Работает |

---

## 📝 История изменений

1. **Инициализация проекта** - базовая структура
2. **Telegram бот** - Telegraf, команды /start, /shop, /admin
3. **Каталог товаров** - CRUD через API
4. **Корзина** - Zustand для состояния
5. **Оплата TON** - прямая оплата через blockchain
6. **Мультивалютность** - TON, USDT, ETH, BTC
7. **Дизайн** - Apple-стиль, анимации
8. **Реальные курсы** - CoinGecko API для актуальных курсов
9. **HD Wallet система** - уникальные адреса для каждого заказа (BTC, ETH, TRON)
10. **Таймаут заказов** - 30 минут на оплату
11. **Защита от двойной оплаты** - проверка txHash
12. **Вебхуки** - endpoint для мгновенных уведомлений
13. **RUB конвертация** - цены в рублях с конвертацией в USD
14. **Base64 MNEMONIC** - поддержка закодированного seed phrase для Railway
15. **MCP Server** - установлен `telegram-bot-mcp-server` для управления ботом
16. **Тестовый товар** - добавлен "Красная Машинка" (1500 RUB)
17. **Railway Issue** - авто-деплой не применяет код, требуется ручной рестарт сервиса

---

## ️ Важные заметки

1. **Безопасность**: Этот файл содержит секреты! Не коммитьте его в git.
2. **Seed Phrase**: Храните `MNEMONIC_SEED` в безопасном месте — это доступ ко всем средствам!
3. **API ключи**: Для ETH/BTC проверок рекомендуется добавить ETHERSCAN_API_KEY.
4. **База данных**: SQLite хранится в `/backend/data/shop.db` на Railway.
5. **Курсы**: CoinGecko API используется для реальных курсов (обновление каждую минуту).
6. **Таймаут**: Заказы истекают через 30 минут после создания.
7. **HD Wallet**: Каждый заказ (кроме TON) получает уникальный адрес депозита — 100% точность привязки платежей.
8. **TON**: Использует общий кошелёк + memo для привязки к заказу.
9. **Вебхуки**: Endpoint `/api/payments/webhook` для мгновенных уведомлений.
10. **RUB**: Цены отображаются в рублях, конвертация в USD происходит на бэкенде.
11. **MNEMONIC_SEED_B64**: Base64 закодированная версия seed phrase для Railway (избегает проблем с обрезкой).
12. **Railway авто-деплой**: Код деплоится автоматически из GitHub main branch, но **требуется ручной рестарт** для применения изменений env vars.
13. **MCP Server**: Запущен локально `telegram-bot-mcp-server` для взаимодействия с ботом через opencode.
14. **Тестовый товар**: "Красная Машинка" (1500 RUB) добавлен в каталог, фото загружено.
15. **Текущая проблема**: ETH/USDT/TRON заказы падают с `invalid mnemonic length`. Нужно вручную нажать "Restart" в Railway Dashboard для backend сервиса.

---

##  Перенос на другой ПК

1. Клонируйте репозиторий: `git clone https://github.com/fomagotov1/telegram-shop-bot.git`
2. Установите зависимости: `cd backend && npm install`, `cd webapp && npm install`
3. Настройте переменные окружения в Railway (включая `MNEMONIC_SEED` и `MNEMONIC_SEED_B64`)
4. Задеплойте бэкенд и фронтенд командами выше

---

*Последнее обновление: 2026-05-20*
