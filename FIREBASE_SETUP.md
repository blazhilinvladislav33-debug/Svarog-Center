# 🔥 Firebase Setup Guide - SVAROG v3.1.0

Посібник для повної налаштування Firebase з усіма функціями системи.

---

## 📋 Перевірочний список перед початком

- [ ] Google Account (Gmail)
- [ ] Credit card (для перевірки, безкоштовно до бюджету)
- [ ] Node.js 18+ встановлено
- [ ] Firebase CLI встановлено (`npm install -g firebase-tools`)
- [ ] Git налаштовано

---

## 🔑 КРОК 1: Створіть Firebase Project

### 1.1 Перейдіть на Firebase Console
```
https://console.firebase.google.com
```

### 1.2 Створіть новий проект
```
"Create a project" (або "Add project")
├─ Project name: "svarog-center"
├─ Analytics: Disable (опціонально)
└─ Create project
```

### 1.3 Дочекайтесь завершення
```
⏳ Creating project... (1-2 хвилини)
✅ Project ready!
```

---

## 🗄️ КРОК 2: Активуйте Firestore Database

### 2.1 Перейдіть до Firestore
```
Firebase Console
└─ Build → Firestore Database
```

### 2.2 Створіть базу даних
```
"Create database"
├─ Location: "Europe (Belgium)" або найближче до вас
├─ Security rules: "Start in production mode"
└─ Create database
```

### 2.3 Замініть правила безпеки
```
Firestore Database
└─ Rules → Copy content from firestore.rules
└─ Publish
```

---

## 🔐 КРОК 3: Налаштуйте Authentication

### 3.1 Увімкніть Email/Password
```
Firebase Console
└─ Build → Authentication
    └─ Sign-in method → Email/Password
        ├─ Enable Email/Password
        └─ Save
```

### 3.2 Налаштуйте Email для верифікації (опціонально)
```
Authentication → Email templates
├─ Customize email templates
├─ Verify email address
└─ Save
```

---

## 💾 КРОК 4: Налаштуйте Cloud Storage

### 4.1 Увімкніть Storage
```
Firebase Console
└─ Build → Storage
    └─ Get started
        ├─ Location: Вибрати регіон
        └─ Done
```

### 4.2 Встановіть правила для Storage
```
Storage → Rules
└─ Замініть default rules на:

rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /media/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && resource.size < 10 * 1024 * 1024; // 10MB max
    }
    match /backups/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## ⚙️ КРОК 5: Отримайте Firebase Config

### 5.1 Перейдіть до Project Settings
```
Firebase Console
└─ ⚙️ Settings → Project settings
```

### 5.2 Скопіюйте Web Config
```
Your apps → Web app (</>) config
└─ Copy configuration:

{
  "apiKey": "AIzaSy...",
  "authDomain": "svarog-center.firebaseapp.com",
  "projectId": "svarog-center",
  "storageBucket": "svarog-center.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abc123def456"
}
```

### 5.3 Вставте в firebase-config.js
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

## 🔧 КРОК 6: Налаштуйте Cloud Functions

### 6.1 Увімкніть Cloud Functions
```
Firebase Console
└─ Build → Functions
    └─ (Functions автоматично увімкнуться при розгортанні)
```

### 6.2 Видобуйте Service Account Key
```
Firebase Console
└─ ⚙️ Settings → Service accounts
    └─ "Generate new private key"
        └─ Зберіжіть як: functions/serviceAccountKey.json
```

### 6.3 Встановіть Firebase CLI
```bash
npm install -g firebase-tools
firebase login  # Дозвольте доступ
firebase init   # В папці functions/
```

### 6.4 Розгорніть Cloud Functions
```bash
cd functions
npm install
firebase deploy --only functions
```

---

## 🗂️ КРОК 7: Ініціалізуйте Firestore Collections

### 7.1 Запустіть init script
```bash
npm install firebase-admin dotenv

# Створіть .env файл з Firebase config:
FIREBASE_PROJECT_ID=svarog-center
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
SUPER_ADMIN_EMAIL=admin@svarog.app
SUPER_ADMIN_PASSWORD=YourSecurePassword123

# Запустіть
node firebase-init.js
```

### 7.2 Перевірте результат
```
Firebase Console
└─ Firestore Database → Collections
    └─ Повинні бути: roles, config, orders, customers, chats, media, etc.
```

---

## 📥 КРОК 8: Мігруйте старі дані

### 8.1 Підготуйте дані у CSV або JSON

**customers.csv:**
```
email,name,phone,city,tier
john@example.com,John Doe,+380123456789,Kyiv,regular
jane@example.com,Jane Smith,+380987654321,Lviv,vip
```

**orders.json:**
```json
[
  {
    "customer_id": "customer-doc-id",
    "order_date": "2024-01-01",
    "status": "delivered",
    "total": 500.00,
    "items": [
      {"name": "Product 1", "price": 100, "quantity": 5}
    ]
  }
]
```

**photos.json:**
```json
[
  {
    "url": "https://example.com/photo1.jpg",
    "order_id": "order-doc-id",
    "title": "Product Photo",
    "type": "image"
  }
]
```

### 8.2 Запустіть migration script
```bash
node data-migration.js --type customers --file customers.csv
node data-migration.js --type orders --file orders.json
node data-migration.js --type photos --file photos.json
node data-migration.js --type chats --file chats.json
```

### 8.3 Перевірте дані в Console
```
Firebase Console → Firestore Database
└─ Клацніть на collection
    └─ Переглядайте мігровані документи
```

---

## 👥 КРОК 9: Налаштуйте користувачів

### 9.1 Усередину Console
```
Firebase Console
└─ Authentication → Users
    └─ "Add user"
        ├─ Email: user@example.com
        ├─ Password: SecurePass123
        └─ Add user
```

### 9.2 Встановіть роль користувача
```
Firestore Database → admins collection
└─ Додайте документ з user UID:

{
  "email": "user@example.com",
  "name": "User Name",
  "role": "operator",
  "permissions": { ... },
  "status": "active",
  "created_at": <timestamp>,
  "updated_at": <timestamp>
}
```

---

## 📊 КРОК 10: Налаштуйте Database Indexes

### 10.1 Оптимізація запитів
```bash
firebase firestore:indexes
```

Це відкриє Firestore Console з рекомендованими індексами.

### 10.2 Клацніть "Create Index" для кожного

Рекомендовані індекси:
```
1. orders: status (ASC) + created_at (DESC)
2. orders: customer_id (ASC) + created_at (DESC)
3. customers: tier (ASC) + created_at (DESC)
4. campaigns: status (ASC) + type (ASC)
5. chats: participants (ASC) + updated_at (DESC)
6. admin_logs: admin_id (ASC) + created_at (DESC)
```

---

## 🔔 КРОК 11: Налаштуйте Cloud Pub/Sub (для планувальників)

### 11.1 Увімкніть Pub/Sub
```
Google Cloud Console
└─ Pub/Sub → Topics
    └─ "Create Topic"
        ├─ Topic name: "schedule-backup"
        ├─ Create Topic
        └─ Повторіть для: schedule-analytics, schedule-cleanup
```

### 11.2 Встановіть Cloud Scheduler
```
Google Cloud Console
└─ Scheduler → Jobs
    └─ "Create Job"
        ├─ Name: backup-job
        ├─ Frequency: "0 2 * * *" (2 AM daily)
        ├─ Timezone: UTC
        ├─ Execution: HTTP
        ├─ URL: <your-cloud-function-url>
        └─ Create
```

---

## 📧 КРОК 12: Налаштуйте Email/SMS (опціонально)

### 12.1 Mailgun для Email
```
Firebase Console
└─ Build → Functions → config
    └─ Встановіть MAILGUN_DOMAIN, MAILGUN_API_KEY

Mailgun (https://mailgun.com)
└─ Отримайте API Key
└─ Додайте verified domain
```

### 12.2 Twilio для SMS
```
Firebase Console
└─ Build → Functions → config
    └─ Встановіть TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN

Twilio (https://twilio.com)
└─ Отримайте Twilio credentials
└─ Купіть Twilio phone number
```

---

## 🤖 КРОК 13: Налаштуйте Telegram Bot (опціонально)

### 13.1 Створіть Telegram Bot
```
Telegram
└─ Пошук: @BotFather
    └─ /newbot
        ├─ name: SVAROG Notifications
        ├─ username: svarog_notifications_bot
        └─ Отримайте TOKEN
```

### 13.2 Видобуйте Chat ID
```
Telegram
└─ Пошук: @userinfobot
    └─ Отримайте ваш Chat ID
```

### 13.3 Встановіть в Environment
```
Firebase Console → Functions → Runtime environment variables

TELEGRAM_BOT_TOKEN=<your-token>
TELEGRAM_CHAT_ID=<your-chat-id>
```

---

## 🔐 КРОК 14: Безпека

### 14.1 Обмежте доступ до API Keys
```
Google Cloud Console
└─ APIs & Services → Credentials
    └─ Натисніть на кожен API Key
        ├─ Application restrictions: HTTP referrers
        ├─ Список: svarog-center.web.app
        └─ Save
```

### 14.2 Увімкніть 2FA для Firebase Console
```
Google Account
└─ Security → Two-Step Verification
    └─ Enable (обов'язково!)
```

### 14.3 Встановіть Billing Alerts
```
Firebase Console
└─ Settings → Billing
    └─ Budget alerts
        ├─ Set budget to $50/month
        └─ Alert at 50%, 90%, 100%
```

---

## ✅ ПЕРЕВІРЯ УСПІХУ

### Checklist:
```
Firebase Console → Firestore
├─ [ ] Collections created (orders, customers, chats, etc.)
├─ [ ] Security rules deployed
├─ [ ] Indexes created
└─ [ ] Sample data visible

Firebase Console → Authentication
├─ [ ] Email/Password enabled
├─ [ ] Super admin user created
└─ [ ] Additional users created

Firebase Console → Storage
├─ [ ] Storage bucket created
├─ [ ] Storage rules deployed
└─ [ ] Sample files uploadable

Firebase Console → Functions
├─ [ ] Functions deployed
├─ [ ] Logs showing no errors
└─ [ ] Cloud Pub/Sub subscriptions active
```

---

## 🧪 КРОК 15: Локальне тестування

### 15.1 Запустіть Firebase Emulator
```bash
firebase emulators:start
```

### 15.2 Отримайте Firestore Emulator URL
```
✔  firestore: Emulator started at http://localhost:8080
✔  auth: Emulator started at http://localhost:9099
✔  storage: Emulator started at http://localhost:4000
```

### 15.3 Налаштуйте .env для локальної розробки
```
FIREBASE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIRESTORE_EMULATOR_HOST=localhost:8080
STORAGE_EMULATOR_HOST=localhost:4000
```

---

## 🚀 КРОК 16: Deploy до Production

### 16.1 Розгорніть правила
```bash
firebase deploy --only firestore:rules
```

### 16.2 Розгорніть Functions
```bash
firebase deploy --only functions
```

### 16.3 Розгорніть все
```bash
firebase deploy
```

---

## 📊 Структура Collections

```
firestore/
├─ admins/
│   └─ {uid}/
│       ├─ email: string
│       ├─ name: string
│       ├─ role: 'super_admin' | 'moderator' | 'operator'
│       ├─ permissions: object
│       └─ created_at: timestamp
│
├─ roles/
│   └─ {roleId}/
│       ├─ name: string
│       ├─ permissions: object
│       └─ updated_at: timestamp
│
├─ customers/
│   └─ {customerId}/
│       ├─ email: string
│       ├─ name: string
│       ├─ phone: string
│       ├─ tier: 'regular' | 'vip'
│       ├─ total_spent: number
│       ├─ photos/
│       │   └─ {photoId}/
│       └─ created_at: timestamp
│
├─ orders/
│   └─ {orderId}/
│       ├─ customer_id: string
│       ├─ status: 'pending' | 'shipped' | 'delivered'
│       ├─ total: number
│       ├─ items: array
│       ├─ photos/
│       │   └─ {photoId}/
│       ├─ messages/
│       │   └─ {messageId}/
│       └─ created_at: timestamp
│
├─ chats/
│   └─ {chatId}/
│       ├─ participants: array
│       ├─ subject: string
│       ├─ messages/
│       │   └─ {messageId}/
│       │       ├─ sender_id: string
│       │       ├─ text: string
│       │       └─ created_at: timestamp
│       └─ created_at: timestamp
│
├─ media/
│   └─ {mediaId}/
│       ├─ url: string
│       ├─ type: 'image' | 'document' | 'video'
│       ├─ size: number
│       ├─ uploaded_by: string
│       └─ created_at: timestamp
│
├─ campaigns/
│   └─ {campaignId}/
│
├─ templates/
│   └─ {templateId}/
│
├─ admin_logs/
│   └─ {logId}/
│
├─ analytics/
│   └─ {periodId}/
│
└─ notifications/
    └─ {userId}/
        └─ {notificationId}/
```

---

## 🆘 Частые проблеми

### ❌ "Permission denied"
```
✓ Перевірте firestore.rules правильно розгорнуто
✓ Перевірте користувач має роль в admins collection
✓ Перевірте гарантії ролі мають потрібні дозволи
```

### ❌ "Document not found"
```
✓ Перевірте документ ID правильний
✓ Переглядайте в Firebase Console
✓ Перевірте collection name точний
```

### ❌ "Quota exceeded"
```
✓ Перевірте Billing alerts
✓ Скоротіть запити в коді
✓ Встановіть rate limiting
```

### ❌ "Authentication required"
```
✓ Перевірте firebase-config.js установлено
✓ Перевірте користувач авторизований
✓ Перевірте токен не закінчився
```

---

## 📞 Корисні посилання

- **Firebase Console**: https://console.firebase.google.com
- **Firebase Documentation**: https://firebase.google.com/docs
- **Firestore Guide**: https://firebase.google.com/docs/firestore
- **Cloud Functions**: https://firebase.google.com/docs/functions
- **Firebase CLI**: https://firebase.google.com/docs/cli
- **Firestore Rules**: https://firebase.google.com/docs/firestore/security

---

## ✨ Наступні кроки

1. **Розгорніть до production** (Firebase Deploy)
2. **Налаштуйте Domain** (Firebase Hosting)
3. **Встановіть Monitoring** (Firebase Performance, Crashlytics)
4. **Налаштуйте Analytics** (Google Analytics for Firebase)
5. **Інтегруйте Sentry** (Error tracking)

**Успішної роботи з Firebase! 🎉**
