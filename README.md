# 🛡️ SVAROG Command Center v3.0.0 - FULL VERSION

**Дата випуску:** 17 серпня 2026  
**Версія:** 3.1.0  
**Статус:** Production Ready ✅

---

## 📋 ВМІСТ

- [Огляд](#огляд)
- [Функції](#функції)
- [Архітектура](#архітектура)
- [Встановлення](#встановлення)
- [Налаштування](#налаштування)
- [Розгортання](#розгортання)
- [Тестування](#тестування)
- [Сценарії використання](#сценарії-використання)
- [Troubleshooting](#troubleshooting)

---

## 🎯 ОГЛЯД

SVAROG Command Center v3.0.0 - це повнофункціональна платформа управління для e-commerce бізнесу.

### Стек технологій
- **Frontend:** Electron + HTML5 + CSS3 + JavaScript (Dark/Light режими)
- **Backend:** Firebase Firestore + Cloud Functions
- **Мобільний:** Telegram Bot з webhook
- **Доставка:** Nova Poshta API
- **Платежі:** Monobank + LiqPay webhooks
- **Email:** Mailgun
- **SMS:** Twilio
- **Резервні копії:** Google Drive + AWS S3 + Dropbox

---

## ✨ ФУНКЦІЇ

### 📊 Панель керування
- Статистика в реальному часі
- Графіки продажів (день/тиждень/місяць/рік)
- Топ товарів
- Географія замовлень
- Прогноз прибутку

### 👥 CRM - Клієнти
- Карточка клієнта зі всією історією
- Теги & сегментація (VIP, звичайні, неактивні)
- Система лояльності
- Історія замовлень & комунікації

### 📦 Управління замовленнями
- Створення замовлення в адмінці
- Редагування статусу
- Інтеграція з Nova Poshta для отслідування
- Друк накладних (PDF)
- Калькулятор вартості в реальному часі
- Масові операції

### 📧📱 Marketing кампанії
- Email кампанії з Mailgun
- SMS кампанії з Twilio
- Push-сповіщення
- Шаблони листів & SMS
- Сегментація аудиторії
- A/B тестування

### 📈 Аналітика
- Графіки продажів
- ROI кампаній
- Конверсія & CTR
- Cohort analysis
- Customer Lifetime Value (CLV)
- Експорт даних

### 🔐 Безпека
- 2FA (TOTP) аутентифікація
- Система ролей (super_admin, moderator, operator)
- Логування всіх дій адмінів
- IP блокування
- Конфіг-ключи видимі тільки Super Admin
- Audit trail

### 💾 Резервні копії
- Автоматичні копії щогодини
- Версіонування
- Encryption
- Restore points на Google Drive, AWS S3, Dropbox

### 🤖 Автоматизація
- Webhook для Cloud Functions
- Workflow Builder (if/then)
- Планування розсилок
- Task Queue
- Batch Processing

### ⚙️ Налаштування
- Управління API ключами
- Конфігурація платіжних систем
- Налаштування email/SMS сервісів
- Резервні копії
- Виключення/блокування користувачів

---

## 🏗️ АРХІТЕКТУРА

```
SVAROG v3.0.0/
├── admin.html               # Electron UI (15+ вкладок)
├── auth.html                # Форма логіну
├── main.js                  # Electron main process
├── firebase-config.js       # Firebase SDK setup
├── constants.js             # Глобальні константи
├── styles.css               # UI стилі (dark/light)
│
├── functions/
│   ├── index.js             # Cloud Functions v3
│   └── package.json
│
├── firestore.rules          # Security rules (roles-based)
├── .github/workflows/
│   └── build.yml            # CI/CD pipeline
│
├── package.json             # App версія
└── README.md                # Документація

```

### Потік даних

```
Користувач (Electron)
    ↓
Firebase Auth (2FA)
    ↓
Firestore Database
    ↓
Cloud Functions
    ├→ Email (Mailgun)
    ├→ SMS (Twilio)
    ├→ Telegram Bot
    ├→ Платежі (Monobank/LiqPay)
    ├→ Доставка (Nova Poshta)
    └→ Резервні копії
```

---

## 📥 ВСТАНОВЛЕННЯ

### Системні вимоги
- **OS:** Windows 10+, macOS 10.14+, Linux
- **Node.js:** 18+
- **npm:** 9+
- **Git:** 2.0+

### 1. Клонування репозиторію

```bash
git clone https://github.com/YOUR_USERNAME/svarog-center-v3.git
cd svarog-center-v3
```

### 2. Встановлення залежностей

```bash
npm install
cd functions && npm install && cd ..
```

### 3. Налаштування Firebase

```bash
npm install -g firebase-tools
firebase login
firebase init
```

Виберіть:
- Firestore
- Cloud Functions
- Hosting (опціонально)

### 4. Налаштування переменних середовища

Скопіюйте `.env.example` в `.env`:

```bash
cp .env.example .env
```

Відредагуйте `.env` з вашими значеннями:

```env
# Firebase
FIREBASE_API_KEY=xxx
FIREBASE_PROJECT_ID=xxx
FIREBASE_STORAGE_BUCKET=xxx

# Mailgun
MAILGUN_DOMAIN=xxx
MAILGUN_API_KEY=xxx

# Twilio
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx

# Nova Poshta
NOVAPOSHTA_API_KEY=xxx

# Telegram
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_ADMIN_CHAT_ID=xxx

# GitHub (для автоматичної збірки)
GH_TOKEN=xxx
```

---

## ⚙️ НАЛАШТУВАННЯ

### Firebase Firestore

1. **Структура колекцій:**
   - `admins` - користувачі системи
   - `customers` - клієнти (CRM)
   - `orders` - замовлення
   - `campaigns` - marketing кампанії
   - `feedback` - зворотний зв'язок
   - `admin_logs` - логування дій
   - `config/*` - налаштування API ключів
   - `templates` - шаблони email/SMS
   - `backups` - метадані резервних копій

2. **Розгортання правил:**
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Встановлення даних:**
   ```bash
   firebase firestore:start
   # Додайте тестові дані через адмін-панель
   ```

### Платіжні системи

#### Monobank
1. Отримайте X-Token з https://monobank.ua/
2. Налаштуйте webhook:
   - URL: `YOUR_DOMAIN/monobank-webhook`
   - Формат: JSON

#### LiqPay
1. Зареєструйтеся на https://www.liqpay.ua/
2. Скопіюйте Merchant ID та Public Key
3. Налаштуйте вебхук з Private Key

### Email розсилка (Mailgun)

1. Зареєструйтеся на https://www.mailgun.com/
2. Скопіюйте Domain та API Key
3. Підтвердіть домен (або скористайтеся sandbox домenom для тестування)

### SMS розсилка (Twilio)

1. Зареєструйтеся на https://www.twilio.com/
2. Скопіюйте Account SID та Auth Token
3. Придбайте Twilio phone number або використовуйте тестовий

### Nova Poshta (доставка)

1. Зареєструйтеся на https://new.novaposhta.ua/
2. Отримайте API Key (TTN Gen 2)
3. Налаштуйте в Settings → Nova Poshta

### Telegram Bot

1. Створіть бота у @BotFather
2. Отримайте Bot Token
3. Налаштуйте webhook на Render:
   ```bash
   https://YOUR_RENDER_URL/webhook
   ```

### Резервні копії

#### Google Drive
1. Створіть Google Cloud Project
2. Активуйте Drive API
3. Створіть Service Account
4. Поділіться папкою з Service Account email

#### AWS S3
1. Створіть AWS аккаунт
2. Створіть S3 bucket
3. Скопіюйте Access Key та Secret Key

#### Dropbox
1. Зареєструйтеся на https://www.dropbox.com
2. Створіть App на https://www.dropbox.com/developers/apps
3. Получите Access Token

---

## 🚀 РОЗГОРТАННЯ

### Локально (розробка)

```bash
# Запуск Electron app
npm start

# В іншому терміналі - Cloud Functions emulator
firebase emulators:start --only firestore,functions
```

### Production Deployment

#### 1. Firebase Cloud Functions

```bash
firebase deploy --only functions
```

#### 2. Firestore Rules

```bash
firebase deploy --only firestore:rules
```

#### 3. Electron App (GitHub Actions)

Налаштування GitHub Actions автоматично:

1. **Створіть GitHub Personal Access Token:**
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token → checkbox `repo` → Generate

2. **Додайте GH_TOKEN в GitHub Secrets:**
   - Repo → Settings → Secrets and variables → Actions
   - New repository secret
   - Name: `GH_TOKEN`
   - Value: [вставьте токен]

3. **Пушіть код:**
   ```bash
   git add .
   git commit -m "Release v3.0.0"
   git push origin main
   ```
   GitHub Actions автоматично збудує Windows/macOS версії

4. **Завантажте в Release:**
   - GitHub → Releases
   - Create Release v3.0.0
   - Завантажте файли: `svarog-center-v3.0.0.exe`, `svarog-center-v3.0.0.dmg`

#### 4. Telegram Bot (Render)

```bash
git push render main
```

Bot автоматично розгортається на Render.

---

## 🧪 ТЕСТУВАННЯ

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
firebase emulators:start --only firestore,functions
npm run test:integration
```

### End-to-End Tests

```bash
npm run test:e2e
```

### Тест Firestore Rules

```bash
firebase emulators:start --only firestore
firebase functions:shell
```

### Тест Cloud Functions

```bash
firebase functions:log
```

---

## 💡 СЦЕНАРІЇ ВИКОРИСТАННЯ

### Сценарій 1: Клієнт робить замовлення

```
1. Клієнт переходить на сайт → вибирає товари → платить
2. Payment webhook → Cloud Function → Firestore (order created)
3. Cloud Function → Email (підтвердження) → Mailgun
4. Cloud Function → SMS (сповіщення) → Twilio
5. Cloud Function → Telegram (адміну) → Bot notifies admin
6. Admin панель → бачить нове замовлення в реальному часі
7. Admin натискає "Create shipment" → Cloud Function → Nova Poshta API
8. Nova Poshta повертає трек-номер → Firestore
9. Cloud Function → Email & SMS з трек-номером → Клієнту
```

### Сценарій 2: Marketing кампанія

```
1. Admin панель → Marketing → Create Email Campaign
2. Admin вибирає шаблон, сегмент (VIP, regular, all)
3. Планує дату відправки
4. Кампанія статус → "scheduled"
5. Cloud Function (cron) запускається → reads campaign
6. Cloud Function → Mailgun → відправляє всім клієнтам
7. Admin панель → Analytics → видит open rates, click rates
8. A/B тест результати → автоматично збирають дані
```

### Сценарій 3: Управління адмінами

```
1. Super Admin → Admins tab → Add Admin
2. Вводить email, пароль, роль (operator/moderator/super_admin)
3. Cloud Function → Firebase Auth → створює user
4. Firestore → documents audit log
5. Moderator не может бачити config keys
6. Operator не может видалити замовлення
7. Super Admin має повний доступ
```

### Сценарій 4: Резервна копія

```
1. Cloud Function (daily 2 AM) → createBackup()
2. Читает всі collections: orders, customers, campaigns, etc.
3. Архивує дані в JSON
4. Загружає на:
   - Google Drive /backups/v3.0.0/backup-2024-01-15.zip
   - AWS S3 s3://bucket/backups/v3.0.0/backup-2024-01-15.zip
   - Dropbox /Apps/SVAROG/backups/v3.0.0/backup-2024-01-15.zip
5. Логирует действие в admin_logs
6. Admin может видит историю и восстановить из backup
```

---

## 🐛 TROUBLESHOOTING

### Проблема: "Firebase configuration not found"

**Рішення:**
```bash
# Переконайтеся, що firebase-config.js налаштований з вашими значеннями
# Проверьте firebaseConfig в firebase-config.js
nano firebase-config.js
# Заповніть YOUR_API_KEY, YOUR_PROJECT_ID, etc.
```

### Проблема: "Mailgun error: Invalid domain"

**Рішення:**
1. Перевірте MAILGUN_DOMAIN - повинен бути весь домен (mg.example.com)
2. Якщо використовуєте sandbox - використовуйте sandbox domain
3. Перевірте API Key правильно скопійований

### Проблема: "Twilio error: Invalid phone number"

**Рішення:**
1. Телефон повинен бути в форматі +380XXXXXXXXX
2. Перевірте TWILIO_ACCOUNT_SID та AUTH_TOKEN
3. Переконайтеся, що акаунт має достатньо кредитів

### Проблема: "Nova Poshta API error: Invalid API Key"

**Рішення:**
1. Скопіюйте свіжий API Key з https://new.novaposhta.ua/
2. Переконайтеся, що використовуєте TTN Gen 2 API
3. Перевірте firestore rules - config видимий тільки Super Admin

### Проблема: "GitHub Actions build failed"

**Рішення:**
1. Переконайтеся, що GH_TOKEN додан в Secrets
2. Перевірте, що токен має `repo` permission
3. Очистьте npm cache: `npm cache clean --force`
4. Переконайтеся, що Node.js версія 18+

### Проблема: "Firestore Rules permission denied"

**Рішення:**
1. Перевірте, що користувач має правильну роль в `admins` collection
2. Розгорніть нові правила: `firebase deploy --only firestore:rules`
3. Перевірте логи в Firestore → Rules → Tests

### Проблема: "Electron app не запускається"

**Рішення:**
```bash
# Очистьте кеш та переустановіть
rm -rf node_modules package-lock.json
npm install
npm start
```

### Проблема: "Telegram Bot не відповідає"

**Рішення:**
1. Перевірте логи на Render: https://dashboard.render.com
2. Переконайтеся, що Bot Token правильний
3. Перевірте, що webhook URL налаштований: https://YOUR_RENDER_URL/webhook
4. Тест: `curl -X POST https://api.telegram.org/botTOKEN/getMe`

---

## 📊 МОНІТОРИНГ

### Cloud Functions Logs

```bash
firebase functions:log
```

### Firestore Analytics

```bash
firebase auth list
firebase firestore:inspect
```

### Electron App Logs

Логи зберігаються в:
- Windows: `%APPDATA%/SVAROG/logs/`
- macOS: `~/Library/Application Support/SVAROG/logs/`
- Linux: `~/.config/SVAROG/logs/`

---

## 📞 КОНТАКТИ & ПОДДЕРЖКА

**Telegram Gruppe:** https://t.me/SvarogCenter
**Email:** support@svarog.local
**GitHub Issues:** https://github.com/YOUR_USERNAME/svarog-center-v3/issues

---

## 📄 ЛІЦЕНЗІЯ

MIT License - вільна для комерційного і особистого використання

---

**Успіхів у впровадженні SVAROG Command Center v3.0.0! 🚀**
