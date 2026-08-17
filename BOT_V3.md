# 🤖 SVAROG Telegram Bot v3.0.0

## Що нового в v3.0?

✅ **Розширені сповіщення:**
- 📋 Нові замовлення
- ✅ Зміна статусу замовлення
- 📦 Статус доставки (Nova Poshta)
- 📧 Email кампанії
- 🛡️ Нові звернення
- 📢 Система CRM

✅ **Нові функції:**
- Пошук замовлення по телефону
- Webhook для Cloud Functions
- Збереження історії клієнтів
- Поддержка мultiple modes (звернення/інформація/замовлення)

✅ **Розширена аутентифікація:**
- Роли адмінів (super_admin, moderator, operator)
- Логування всіх дій
- Безпека для конфіг-ключів

---

## Установка & Розгортання

### Локально (тестування)
```bash
pip install -r requirements.txt
python bot.py
```

### На Render (production)

**Сервіс:** `botsvarog-1`

**Build Command:**
```bash
pip install -r requirements.txt
```

**Start Command:**
```bash
python bot.py
```

**Environment Variables:**
```
BOT_TOKEN=ВАШ_ТОКЕН_ВІД_BOTFATHER
ADMIN_CHAT_ID=-1004110475608
WEBHOOK_SECRET=svarog-secret-2026
RENDER_EXTERNAL_URL=https://botsvarog-1.onrender.com
PORT=10000
```

---

## 📨 Webhook Сповіщення

Bot приймає сповіщення від Cloud Functions на `/notify` endpoint.

### Формат сповіщення:

```json
{
  "type": "order_created",
  "order": {
    "id": "order_123",
    "name": "John Doe",
    "phone": "+380501234567",
    "items_count": 3,
    "total": 1500,
    "status": "pending"
  }
}
```

### Типи подій:

```
order_created      — Нове замовлення
order_updated      — Зміна статусу замовлення
feedback_created   — Нове звернення
campaign_sent      — Email кампанія відправлена
```

---

## 🔐 Ролі & Дозволи

### super_admin
- ✅ Всі налаштування
- ✅ Керування адмінами
- ✅ Видалення даних
- ✅ Перегляд всіх логів

### moderator
- ✅ Керування товарами, новинами
- ✅ Керування замовленнями
- ✅ Керування звернення
- ❌ Не бачить конфіг-ключи
- ❌ Не може видаляти адмінів

### operator
- ✅ Оновлення статусу замовлення
- ✅ Перегляд замовлень
- ✅ Додавання примітки до замовлення
- ❌ Не може видаляти
- ❌ Не може змінювати налаштування

---

## 📞 Команди Боту

```
/start        — Почати роботу
/help         — Довідка
/id           — Дізнатися ID чату/користувача
/status       — Статус бота
```

---

## 🧪 Тестування

### Тест локально:
```bash
python bot.py
```

### Тест вебхука:
```bash
curl -X POST https://botsvarog-1.onrender.com/notify \
  -H "Content-Type: application/json" \
  -d '{
    "type": "order_created",
    "order": {"id": "123", "name": "Test", "total": 500}
  }'
```

### Тест сповіщень в адмінці:
1. Йди в **⚙️ Налаштування**
2. Натисни **🧪 Test Notification**
3. Повинно прийти в адмін-групу

---

## 📝 Структура Бази Даних (SQLite)

```sql
users
├─ user_id (PRIMARY KEY)
├─ name
├─ username
├─ phone
└─ created_at

modes
├─ user_id (PRIMARY KEY)
└─ mode (contact/info/order)

routing
├─ admin_msg_id (PRIMARY KEY)
└─ user_id

user_orders
├─ user_id
├─ order_id (PRIMARY KEY)
└─ phone
```

---

## 🔄 Інтеграція з Cloud Functions

Cloud Function можна викликати для відправки сповіщення:

```javascript
// Приклад з Cloud Function
const axios = require('axios');

const notifyBot = async (event) => {
  await axios.post('https://botsvarog-1.onrender.com/notify', {
    type: 'order_created',
    order: {
      id: event.orderId,
      name: event.customerName,
      phone: event.phone,
      items_count: event.items.length,
      total: event.total
    }
  });
};
```

---

## 🐛 Debugging

### Логи на Render:
Йди на: https://dashboard.render.com/services/botsvarog-1 → Logs

### Локальне відлагодження:
```bash
python bot.py  # Див логи в консолі
```

### Поширені проблеми:

❌ **Bot не відповідає на /start**
- Перевір BOT_TOKEN
- Перевір бот додан у чат

❌ **Вебхук не працює**
- Перевір WEBHOOK_SECRET
- Перевір RENDER_EXTERNAL_URL

❌ **Сповіщення не приходять**
- Перевір ADMIN_CHAT_ID
- Перевір бот адмін у групі
- Дивись логи на Render

---

## 📦 requirements.txt

```
aiogram==3.4.1
aiohttp==3.9.1
python-dotenv==1.0.0
```

---

## 🚀 Оновлення на нову версію

1. Змініть версію в `package.json` на v3.0.1
2. Оновіть `bot.py`
3. Push у GitHub
4. GitHub Actions автоматично створить Release
5. Render автоматично розгорне нову версію

---

**Бот готовий! 🚀**
