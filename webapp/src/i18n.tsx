import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Lang = 'ru' | 'en';

const translations: Record<Lang, Record<string, string>> = {
  ru: {
    catalog: 'Каталог',
    cart: 'Корзина',
    support: 'Поддержка',
    empty_cart: 'Корзина пуста',
    empty_cart_desc: 'Добавьте товары из каталога',
    go_to_catalog: 'Перейти в каталог',
    total: 'Итого',
    pay: 'Оплатить',
    checkout_title: 'Оплата',
    select_currency: 'Выберите криптовалюту:',
    pay_via: 'Оплата через',
    pay_note: 'После нажатия «Оплатить» вы получите адрес кошелька для перевода.',
    order_valid: 'Заказ действителен 15 минут.',
    pay_btn: 'Оплатить {amount} ₽',
    error_order: 'Ошибка при создании заказа. Попробуйте снова.',
    only_telegram: 'Это приложение работает только внутри Telegram.',
    payment_title: 'Оплата {currency}',
    time_left: 'Осталось: {time}',
    wallet_address: 'Адрес кошелька',
    copy: 'Копировать',
    copied: '✓ Скопировано',
    memo_label: 'Комментарий (memo)',
    step1: 'Откройте кошелёк {currency}',
    step2: 'Отправьте {amount} {currency} на указанный адрес',
    step3: 'Обязательно укажите комментарий (memo)',
    step4: 'Статус обновится автоматически',
    waiting: 'Ожидание оплаты...',
    paid_title: 'Оплата подтверждена',
    paid_text: 'Ваш заказ оплачен. Спасибо за покупку!',
    back_catalog: 'Вернуться в каталог',
    expired_title: 'Время оплаты истекло',
    expired_text: 'Заказ не был оплачен в течение 15 минут.',
    cancelled_title: 'Оплата отменена',
    cancel_payment: 'Отменить оплату',
    problem_payment: 'Проблема с оплатой?',
    support_title: 'Техподдержка',
    support_order: 'Номер заказа (если есть)',
    support_desc: 'Опишите проблему',
    support_placeholder: 'Что случилось? Подробно опишите вашу проблему...',
    support_send: 'Отправить',
    support_sending: 'Отправка...',
    support_sent_title: 'Сообщение отправлено',
    support_sent_text: 'Мы ответим вам в ближайшее время через Telegram.',
    confirm_pay: 'Вы уверены, что хотите оплатить {amount} ₽ через {currency}?',
    yes: 'Да',
    no: 'Нет',
    i_paid: 'Я оплатил',
    checking: 'Проверка...',
    language: 'Русский',
    products_count: '{count} товаров',
    product: 'товар',
    products: 'товаров',
    add_to_cart: 'В корзину',
    added: 'Добавлено ✓',
    item_count: '× {count}',
    rub: '₽',
  },
  en: {
    catalog: 'Catalog',
    cart: 'Cart',
    support: 'Support',
    empty_cart: 'Cart is empty',
    empty_cart_desc: 'Add items from catalog',
    go_to_catalog: 'Go to catalog',
    total: 'Total',
    pay: 'Pay',
    checkout_title: 'Checkout',
    select_currency: 'Select cryptocurrency:',
    pay_via: 'Pay via',
    pay_note: 'After clicking "Pay" you will receive a wallet address.',
    order_valid: 'Order is valid for 15 minutes.',
    pay_btn: 'Pay {amount} ₽',
    error_order: 'Error creating order. Please try again.',
    only_telegram: 'This app works only inside Telegram.',
    payment_title: 'Pay {currency}',
    time_left: 'Time left: {time}',
    wallet_address: 'Wallet address',
    copy: 'Copy',
    copied: '✓ Copied',
    memo_label: 'Comment (memo)',
    step1: 'Open your {currency} wallet',
    step2: 'Send {amount} {currency} to the address below',
    step3: 'Make sure to include the comment (memo)',
    step4: 'Status will update automatically',
    waiting: 'Waiting for payment...',
    paid_title: 'Payment confirmed',
    paid_text: 'Your order has been paid. Thank you!',
    back_catalog: 'Back to catalog',
    expired_title: 'Payment time expired',
    expired_text: 'Order was not paid within 15 minutes.',
    cancelled_title: 'Payment cancelled',
    cancel_payment: 'Cancel payment',
    problem_payment: 'Problem with payment?',
    support_title: 'Support',
    support_order: 'Order number (if any)',
    support_desc: 'Describe your problem',
    support_placeholder: 'What happened? Describe your problem in detail...',
    support_send: 'Send',
    support_sending: 'Sending...',
    support_sent_title: 'Message sent',
    support_sent_text: 'We will reply to you via Telegram shortly.',
    confirm_pay: 'Are you sure you want to pay {amount} ₽ via {currency}?',
    yes: 'Yes',
    no: 'No',
    i_paid: 'I have paid',
    checking: 'Checking...',
    language: 'English',
    products_count: '{count} items',
    product: 'item',
    products: 'items',
    add_to_cart: 'Add to cart',
    added: 'Added ✓',
    item_count: '× {count}',
    rub: '₽',
  },
};

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LangContext = createContext<LangContextType>({
  lang: 'ru',
  setLang: () => {},
  t: (k: string) => k,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try { return (localStorage.getItem('shop_lang') as Lang) || 'ru'; } catch { return 'ru'; }
  });

  useEffect(() => {
    try { localStorage.setItem('shop_lang', lang); } catch {}
  }, [lang]);

  function t(key: string, params?: Record<string, string | number>): string {
    let text = translations[lang][key];
    if (text === undefined) {
      text = translations.ru[key] || key;
    }
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
