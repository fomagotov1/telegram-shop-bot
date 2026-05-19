# Telegram Shop Bot

Telegram Mini App для автоматизированной торговли с оплатой криптовалютой через Cryptomus.

## Структура

```
├── backend/          # Node.js + Express + Telegraf + SQLite
│   ├── src/
│   │   ├── controllers/   # Обработчики запросов
│   │   ├── routes/        # API маршруты
│   │   ├── services/      # Cryptomus API
│   │   ├── db.ts          # SQLite
│   │   ├── bot.ts         # Telegram bot
│   │   └── index.ts       # Точка входа
│   └── uploads/      # Загруженные изображения
└── webapp/           # React + TypeScript + Vite
    └── src/
        ├── components/    # UI компоненты
        ├── pages/         # Страницы
        ├── hooks/         # Zustand store
        ├── styles/        # Глобальные стили
        └── types/         # TypeScript типы
```

## Настройка

### 1. Telegram Bot

1. Напиши [@BotFather](https://t.me/BotFather)
2. Создай нового бота: `/newbot`
3. Скопируй токен

### 2. Cryptomus

1. Зарегистрируйся на [cryptomus.com](https://cryptomus.com/)
2. Создай мерчант в разделе Merchant
3. Скопируй `Merchant ID` и `API Key`
4. В настройках мерчанта укажи Callback URL: `https://your-domain.com/api/payments/webhook`

### 3. Backend

```bash
cd backend
cp .env.example .env
# Заполни .env своими данными
npm install
npm run dev
```

### 4. Webapp

```bash
cd webapp
npm install
npm run dev
```

### 5. .env (backend)

```env
BOT_TOKEN=token_от_botfather
CRYPTOMUS_MERCHANT_ID=merchant_id
CRYPTOMUS_API_KEY=api_key
SERVER_URL=https://your-domain.com
PORT=3000
ADMIN_TELEGRAM_ID=your_telegram_id
```

### 6. Подключение Mini App

1. В [@BotFather](https://t.me/BotFather): `/mybots` → выбери бота → Bot Settings → Menu Button
2. Укажи URL: `https://your-domain.com` (или ngrok для тестов)
3. Текст кнопки: "Открыть магазин"

### 7. Деплой

Для продакшена нужен HTTPS. Варианты:
- **ngrok** (для тестов): `ngrok http 3000`
- **VPS + nginx** + LetsEncrypt
- **Railway/Render** — бесплатный хостинг

## Функционал

- **Каталог** — сетка товаров с категориями
- **Корзина** — добавление, изменение количества, удаление
- **Оплата** — Cryptomus (USDT, BTC, ETH, TON и др.)
- **Автопроверка** — polling + webhook для подтверждения оплаты
- **Уведомления** — бот отправляет сообщение при подтверждении оплаты
- **Админ-панель** — добавление/редактирование/удаление товаров с фото

## Дизайн

Apple-style минимализм:
- SF Pro / системные шрифты
- Blur-эффекты (backdrop-filter)
- Плавные анимации
- Safe area для iPhone
