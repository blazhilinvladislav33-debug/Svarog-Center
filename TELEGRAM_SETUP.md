# 🤖 SVAROG Telegram Bot Setup

## Дані для інтеграції

```
🔑 BOT_TOKEN: ВАШ_ТОКЕН_ВІД_BOTFATHER
👥 ADMIN_CHAT_ID: -1004110475608
📢 INFO_CHANNEL_ID: [відключено]
```

## Структура роботи

### 1️⃣ **Electron App** (`admin.html` + `main.js`)
- Головна адмін-панель на Windows/Mac
- Керування товарами, новинами, замовленнями
- Налаштування Telegram (зберігаються у Firestore `config/telegram`)

### 2️⃣ **Cloud Functions** (`functions/index.js`)
- Автоматичні сповіщення при:
  - **Новому замовленні** → `📋 Нове замовлення!`
  - **Змініння статусу** → `✅ Статус оновлено`
  - **Новому звернені** → `🛡 Нове звернення!`
- Запускаються через Firestore triggers

### 3️⃣ **Telegram Bot** (`bot.py`)
- Запускається на **Render** (Webhook режим)
- Отримує повідомлення від користувачів
- Перенаправляє в адмін-групу (`-1004110475608`)
- Адміни можуть відповідати, натиснувши Reply

---

## 🚀 Розгортання

### **A) Electron App (на твоєму ПК)**

```bash
npm install
npm run dist:win  # Збірка для Windows
npm run dist:mac  # Збірка для Mac
```

### **B) Cloud Functions (Firebase)**

```bash
cd functions
npm install
firebase deploy --only functions
```

⚠️ **Потрібні env vars для Functions:**
```
TELEGRAM_BOT_TOKEN=ВАШ_ТОКЕН_ВІД_BOTFATHER
ADMIN_CHAT_ID=-1004110475608
```

### **C) Telegram Bot (на Render)**

Сервіс: `botsvarog-1`

**Build Command:**
```bash
pip install -r requirements.txt
```

**Start Command:**
```bash
python bot.py
```

**Env vars на Render:**
```
BOT_TOKEN=ВАШ_ТОКЕН_ВІД_BOTFATHER
ADMIN_CHAT_ID=-1004110475608
WEBHOOK_SECRET=svarog-secret-2026
```

---

## 📝 Налаштування в адмінці

### В `admin.html` додана вкладка **"⚙️ Налаштування"**

**TelegramSection:**
- ✅ Включити/вимкнути сповіщення
- 🔑 Bot Token (для зміни, якщо потрібно)
- 👥 Admin Chat ID
- 📢 Info Channel ID (опціонально)
- 🧪 Test Notification (кнопка для тесту)

**Налаштування зберігаються в Firestore:**
```
config/telegram
  ├── enabled: true
  ├── botToken: "8576872452:..."
  ├── adminChatId: "-1004110475608"
  └── infoChannelId: ""
```

---

## 🔄 Як це працює

### **Користувач пише в Telegram бота**
```
1. Відкриває @SvarogBot
2. Натискає /start
3. Вибирає тип: "🛡 Звернення" або "📢 Важлива інформація"
4. Пише повідомлення
5. Повідомлення потрапляє в адмін-групу (-1004110475608)
```

### **Адмін отримує сповіщення**
```
🛡 Звернення від John Doe · @johndoe
Привіт, у мене питання про замовлення...

[Reply] → повідомлення йде назад користувачу
```

### **Замовлення змінило статус**
```
✅ Змінилась статус замовлення!
ID: order_123
Клієнт: John Doe
Телефон: +380501234567
Старий статус: pending
Новий статус: shipped
```

---

## ✅ Тестування

### 1️⃣ **Перевірити Telegram Bot**
Відкрий `https://t.me/SvarogBot` → натисни `/start`

### 2️⃣ **Перевірити Cloud Functions**
Викличи HTTP функцію:
```bash
curl https://[FIREBASE_REGION]-[PROJECT_ID].cloudfunctions.net/testNotification
```

Має прийти тестове сповіщення в адмін-чат.

### 3️⃣ **Перевірити адмін-панель**
Відкрий Electron app → **⚙️ Налаштування** → натисни **🧪 Test**

---

## 🐛 Troubleshooting

### ❌ Сповіщення не приходять
1. Перевір `ADMIN_CHAT_ID` - він правильний?
2. Перевір бот додан в групу як адмін
3. Перевір Cloud Functions логи: `firebase functions:log`

### ❌ Бот на Render не запускається
1. Перевір `python bot.py` запускається локально: `python bot.py`
2. Перевір env vars на Render (Build logs)
3. Перевір `requirements.txt` установлюється

### ❌ Electron app краширується
1. Перевір версія Node.js >= 16
2. Перевір `npm install` пройшов без помилок
3. Дивись логи: `npm start` (dev режим)

---

## 🔐 Безпека

- ✅ Bot token зберігається як env var (не в коді)
- ✅ Webhook secret обов'язковий
- ✅ Firestore rules обмежують доступ
- ✅ Admin access перевіряється через `isAdmin()` функцію

---

## 📞 Контакти для адмінів

**Telegram адмін-група:** `-1004110475608`

Вся комунікація з користувачами йде туди автоматично.
