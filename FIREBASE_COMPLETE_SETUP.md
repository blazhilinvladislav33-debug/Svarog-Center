# 🔥 Firebase Complete Setup & Features - SVAROG v3.1.0

Повний посібник для налаштування і використання всіх Firebase функцій системи.

---

## 📊 Що реалізовано

### ✅ Основні сервіси Firebase

| Сервіс | Статус | Функції |
|--------|--------|---------|
| **Authentication** | ✅ | Email/Password, Roles, Permissions |
| **Firestore** | ✅ | Real-time DB, Collections, Queries, Transactions |
| **Cloud Storage** | ✅ | File Upload, Media Management, Photos |
| **Cloud Functions** | ✅ | Serverless Backend, Webhooks, Schedulers |
| **Pub/Sub** | ✅ | Message Queue, Async Processing |
| **Scheduled Tasks** | ✅ | Daily Backups, Analytics, Cleanup |

### ✅ Система управління даними

| Функція | Статус | Деталі |
|---------|--------|--------|
| **Чати** | ✅ | Real-time messaging, Multiple participants |
| **Фото** | ✅ | Order photos, Customer photos, Media library |
| **Мігрування даних** | ✅ | CSV/JSON import, Photos, Chats, Customers, Orders |
| **Правила безпеки** | ✅ | Role-based access, Document-level permissions |
| **Бек-апи** | ✅ | Google Drive, AWS S3, Dropbox |
| **Логування** | ✅ | Admin activity, Order changes, Audit trail |

---

## 📁 Нові файли

### 1. **firestore.rules** (16 KB, 500+ lines)
Повні правила безпеки Firebase Firestore з:
- Role-based access control (super_admin, moderator, operator)
- Document-level permissions
- Collection-specific rules
- Real-time subcollections (messages, photos)
- Helper functions для перевірки доступу

### 2. **firebase-init.js** (16 KB, 500+ lines)
Скрипт ініціалізації Firebase з:
- Автоматичним створенням collections
- Встановленням roles та permissions
- Створенням super admin账户
- Sample data для тестування
- Index recommendations

**Використання:**
```bash
node firebase-init.js
node firebase-init.js --sample  # З sample data
```

### 3. **data-migration.js** (14 KB, 450+ lines)
Утиліта для мігрування даних з:
- Підтримкою CSV та JSON форматів
- Валідацією email/phone
- Пакетної обробки
- Мігруванням чатів з повідомленнями
- Мігруванням фото до collections

**Використання:**
```bash
node data-migration.js --type customers --file customers.csv
node data-migration.js --type orders --file orders.json
node data-migration.js --type photos --file photos.json
node data-migration.js --type chats --file chats.json
```

### 4. **firebase-config.js** (16 KB, 550+ lines) - UPDATED
Розширено з функціями:
- `createChat()` - створити чат
- `getUserChats()` - отримати чати користувача
- `getChatMessages()` - отримати повідомлення
- `sendMessage()` - відправити повідомлення
- `listenToChatMessages()` - слухати в реальному часі
- `uploadMedia()` - завантажити файл
- `addOrderPhoto()` / `getOrderPhotos()` - фото замовлень
- `addCustomerPhoto()` / `getCustomerPhotos()` - фото клієнтів

### 5. **firestore.rules** (16 KB, 500+ lines)
Повні Firestore security rules з:
- Collections: admins, roles, config, orders, customers, campaigns, templates, feedback, chats, notifications, media, analytics
- Subcollections: messages (в chats і orders), photos (в orders і customers)
- Role-based access control
- Document validation
- Real-time protection

### 6. **FIREBASE_SETUP.md** (16 KB)
Покроковий посібник:
- Крок 1: Створення Firebase Project
- Крок 2: Активація Firestore Database
- Крок 3: Налаштування Authentication
- Крок 4: Налаштування Cloud Storage
- Крок 5: Отримання Firebase Config
- Крок 6: Налаштування Cloud Functions
- Крок 7: Ініціалізація Collections
- Крок 8: Мігрування старих даних
- Крок 9-16: Додаткові налаштування

### 7. **CHAT_MEDIA_GUIDE.md** (14 KB)
Посібник з інтеграції:
- Структура collections
- API functions для чатів
- API functions для фото
- UI примери (chat widget, photo upload)
- Приклади мігрування
- Безпека
- Performance tips
- Testing
- Troubleshooting

---

## 🎯 Останній чекліст

### ✅ Готово в коді

- [x] Firestore collections структура визначена
- [x] Security rules написані і тестовані
- [x] Chat functions реалізовані (create, send, listen)
- [x] Photo functions реалізовані (upload, add, get)
- [x] Migration script готовий до використання
- [x] Init script автоматизує setup
- [x] Документація повна

### 📋 Потрібно в Firebase Console

1. **Створити Firebase Project**
   ```
   https://console.firebase.google.com
   → Create project → svarog-center
   ```

2. **Активувати Firestore**
   ```
   Build → Firestore Database → Create database
   ```

3. **Активувати Storage**
   ```
   Build → Storage → Get started
   ```

4. **Активувати Authentication**
   ```
   Build → Authentication → Email/Password
   ```

5. **Розгорнути security rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

6. **Розгорнути Cloud Functions**
   ```bash
   firebase deploy --only functions
   ```

7. **Запустити firebase-init.js**
   ```bash
   node firebase-init.js
   ```

8. **Мігрувати старі дані** (якщо є)
   ```bash
   node data-migration.js --type customers --file data.csv
   ```

---

## 🚀 Швидкий старт (15 хвилин)

### 1. Firebase Setup
```bash
# Встановіть Firebase CLI
npm install -g firebase-tools

# Залогіньтесь
firebase login

# Ініціалізуйте project
firebase init

# Створіть .env з Firebase config
cp .env.example .env
# Редагуйте: FIREBASE_PROJECT_ID, API keys
```

### 2. Ініціалізація БД
```bash
# Створіть collections, roles, admin user
node firebase-init.js

# Тестовий режим
firebase emulators:start
```

### 3. Мігрування даних (якщо є)
```bash
# Підготуйте файли: customers.csv, orders.json, photos.json

node data-migration.js --type customers --file customers.csv
node data-migration.js --type orders --file orders.json
node data-migration.js --type photos --file photos.json
```

### 4. Deploy
```bash
# Розгорніть rules
firebase deploy --only firestore:rules

# Розгорніть functions
firebase deploy --only functions

# Перевірте
firebase console
```

---

## 💬 Приклади використання

### Сценарій 1: Чат між адміном і клієнтом

```javascript
import { 
  createChat, 
  sendMessage, 
  listenToChatMessages,
  getCurrentUser 
} from './firebase-config.js';

const user = getCurrentUser();

// Адмін створює чат
const chatId = await createChat(['admin-uid', 'customer-uid'], 'Order Support');

// Відправити повідомлення
await sendMessage(chatId, user.uid, 'Hello! How can I help?');

// Слухати нові повідомлення
listenToChatMessages(chatId, (messages) => {
  messages.forEach(msg => {
    console.log(`${msg.sender_id}: ${msg.text}`);
  });
});
```

### Сценарій 2: Завантажити фото замовлення

```javascript
import { uploadMedia, addOrderPhoto } from './firebase-config.js';

const file = document.getElementById('fileInput').files[0];
const user = getCurrentUser();

// Завантажити файл
const uploaded = await uploadMedia(file, user.uid, 'image');

// Додати до замовлення
const photoId = await addOrderPhoto('order123', uploaded.url, 'Product photo');

console.log('Photo added:', photoId);
```

### Сценарій 3: Мігрування чатів

**Файл: old_chats.json**
```json
[
  {
    "participants": ["admin@example.com", "customer@example.com"],
    "subject": "Order #123",
    "messages": [
      {
        "sender_id": "admin@example.com",
        "text": "Your order is ready!",
        "created_at": "2024-01-01T10:00:00Z"
      }
    ],
    "created_at": "2024-01-01T09:00:00Z"
  }
]
```

**Запуск:**
```bash
node data-migration.js --type chats --file old_chats.json
```

---

## 📊 Архітектура

```
SVAROG v3.1.0
│
├─ Frontend
│  ├─ auth.html (login)
│  └─ admin.html (15+ tabs)
│
├─ Firebase Backend
│  ├─ Firestore Database
│  │  ├─ Collections (admins, customers, orders, chats, media...)
│  │  ├─ Subcollections (messages, photos)
│  │  └─ Indexes (optimized queries)
│  │
│  ├─ Cloud Functions (Node.js 18)
│  │  ├─ Email/SMS (Mailgun, Twilio)
│  │  ├─ Payments (Monobank, LiqPay)
│  │  ├─ Telegram Bot
│  │  ├─ Backups (Google Drive, S3, Dropbox)
│  │  ├─ Scheduled Tasks (Pub/Sub)
│  │  └─ Webhooks
│  │
│  ├─ Cloud Storage
│  │  └─ media/ (photos, documents)
│  │
│  └─ Security Rules
│     ├─ Firestore rules
│     ├─ Storage rules
│     └─ Role-based access control
│
└─ Utilities
   ├─ firebase-init.js (setup)
   ├─ data-migration.js (import)
   └─ firebase-config.js (SDK)
```

---

## 🔐 Безпеки

### Roles & Permissions

```
super_admin
├─ Read/Create/Update/Delete: All collections
├─ Manage: Config, API keys, Users
└─ View: All logs

moderator
├─ Read/Create/Update: Content, Campaigns, Customers
├─ Limited: Orders, Analytics
└─ No access: Config, API keys

operator
├─ Read/Create/Update: Orders, Customers
├─ Limited: Campaigns
├─ No access: Config, Users
└─ No access: Logs
```

### API Key Protection

```
config/telegram
config/monobank
config/liqpay
config/mailgun
config/twilio
config/novaPoshta
config/awsS3
config/googleDrive
config/dropbox

⚠️ Права:
- super_admin: Може читати все
- moderator: НЕ може читати API keys
- operator: НЕ може читати API keys
```

---

## 📈 Примітки щодо використання

### Limits & Quotas

| Ресурс | Ліміт | Тип |
|--------|-------|-----|
| Firestore Reads | 50,000/день | Free |
| Firestore Writes | 20,000/день | Free |
| Storage | 5 GB | Free |
| Cloud Functions | 2 million invokes/month | Free |
| File Size | 10 MB | Firebase Storage |

### Optimization Tips

1. **Pagination** для великих collections
2. **Индексування** для complex queries
3. **Кешування** для часто читаних даних
4. **Batch operations** для декількох документів
5. **Real-time listeners** тільки коли потрібні

---

## 🆘 Common Issues

### ❌ "Permission denied" при читанні

```
✓ Перевірте Firestore rules розгорнуто
✓ Перевірте користувач має role в admins collection
✓ Перевірте role має дозволи в config
```

### ❌ "Quota exceeded"

```
✓ Встановіть Billing alerts ($50/month)
✓ Оптимізуйте queries (використовуйте indexes)
✓ Скоротіть real-time listeners
```

### ❌ "Chat messages не з'являються"

```
✓ Перевірте listenToChatMessages підписав
✓ Перевірте учасник в participants array
✓ Перевірте messages subcollection існує
```

---

## 📚 Документація

- **FIREBASE_SETUP.md** - Покроковий setup guide
- **CHAT_MEDIA_GUIDE.md** - Chat & media integration
- **DEPLOYMENT.md** - Production deployment
- **firestore.rules** - Security rules
- **firebase-config.js** - SDK functions
- **firebase-init.js** - Initialization script
- **data-migration.js** - Data import utility

---

## ✨ Наступні кроки

1. **Розгорніть на Firebase** (FIREBASE_SETUP.md)
2. **Мігруйте старі дані** (data-migration.js)
3. **Налаштуйте APIkeys** (config collection)
4. **Розгорніть Cloud Functions** (firebase deploy)
5. **Тестуйте локально** (firebase emulators)
6. **Deploy до production** (firebase deploy --prod)

---

**Успішної роботи з Firebase! 🎉🔥**

Для питань: читайте документацію та перевіряйте Firebase Console → Firestore → Insights
