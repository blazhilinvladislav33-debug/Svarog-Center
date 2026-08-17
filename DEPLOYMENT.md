# 🚀 SVAROG Command Center v3.0.0 - DEPLOYMENT GUIDE

Повний гайд розгортання SVAROG Command Center v3.0.0 на production.

---

## 📋 CHECKLIST ДО РОЗГОРТАННЯ

- [ ] Всі файли завантажені на GitHub
- [ ] GitHub Personal Access Token (GH_TOKEN) створений
- [ ] GH_TOKEN додан в GitHub Secrets
- [ ] Firebase проект налаштований
- [ ] Firestore rules розгорнені
- [ ] Cloud Functions розгорнені
- [ ] Telegram Bot налаштований на Render
- [ ] Mailgun налаштований
- [ ] Twilio налаштований
- [ ] Nova Poshta ключ отримано
- [ ] Моноbank webhook налаштований
- [ ] LiqPay webhook налаштований
- [ ] Резервні копії настаблені
- [ ] HTTPS сертифікат для webhooks
- [ ] DNS записи оновлені

---

## ФАЗА 1: FIREBASE SETUP

### 1.1 Створіть Firebase проект

1. Перейдіть на https://console.firebase.google.com
2. Натисніть "Create Project"
3. Назва: `svarog-center-v3`
4. Вибір регіону: Europe (Франкфурт)
5. Натисніть "Create"

### 1.2 Активуйте Firestore

1. В консолі → Firestore Database → Create database
2. Режим: **Production** (не Development!)
3. Регіон: europe-west1
4. Create

### 1.3 Активуйте Cloud Functions

1. Cloud Functions → Activate API
2. Встановіть region: europe-west1

### 1.4 Налаштуйте Authentication

1. Authentication → Sign-in method
2. Вибір методів:
   - Email/Password ✅
   - Anonymous (опціонально)
3. Включите 2FA

### 1.5 Отримайте конфігурацію Firebase

1. Project Settings → General
2. Скопіюйте firebaseConfig
3. Вставте в `firebase-config.js`

```javascript
const firebaseConfig = {
  apiKey: "AIzaS...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
};
```

### 1.6 Розгорніть Firestore Rules

```bash
firebase login
firebase init
firebase deploy --only firestore:rules
```

**firestore.rules** має містити:
- Role-based access control
- Collection-level permissions
- Config keys видимі тільки Super Admin

---

## ФАЗА 2: GITHUB SETUP

### 2.1 Створіть репозиторій

```bash
git init
git add .
git commit -m "Initial commit - SVAROG v3.0.0"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/svarog-center-v3.git
git push -u origin main
```

### 2.2 Створіть GitHub Personal Access Token

**ВАЖЛИВО! Це критично для автоматичної збірки!**

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Натисніть "Generate new token (classic)"
3. Назва: `GH_TOKEN`
4. Виберіть права:
   - ✅ `repo` (повний доступ до репо)
   - ✅ `write:packages`
   - ✅ `delete:packages`
5. Натисніть "Generate"
6. **Скопіюйте токен** (більше не буде видно!)

### 2.3 Додайте GH_TOKEN в GitHub Secrets

1. GitHub Repo → Settings → Secrets and variables → Actions
2. Натисніть "New repository secret"
3. Name: `GH_TOKEN`
4. Value: [вставте копійований токен]
5. Натисніть "Add secret"

**НІКОЛИ не додавайте токен в файли або commit!**

### 2.4 Перевірте GitHub Actions

1. GitHub Repo → Actions
2. Повинен бути workflow `build.yml`
3. Натисніть на workflow
4. Перевірте, що всі кроки успішні

---

## ФАЗА 3: CLOUD FUNCTIONS DEPLOYMENT

### 3.1 Налаштуйте Cloud Functions

```bash
cd functions
npm install
```

Переконайтеся, що `functions/index.js` має всі функції:
- `sendEmail`
- `sendSms`
- `telegramWebhook`
- `monobankWebhook`
- `liqpayWebhook`
- `getTrackingInfo`
- `createBackup`
- `scheduledBackup` (щодня о 2 AM)
- `calculateAnalytics` (щогодини)

### 3.2 Розгорніть Cloud Functions

```bash
firebase deploy --only functions
```

Перевірте логи:
```bash
firebase functions:log
```

### 3.3 Активуйте Pub/Sub для scheduled функцій

Cloud Scheduler буде автоматично створений. Перевірте:
1. Google Cloud Console → Cloud Scheduler
2. Jobs повинні бути створені:
   - `scheduledBackup` (щодня 2 AM UTC+0)
   - `calculateAnalytics` (щогодини)

---

## ФАЗА 4: API KEYS SETUP

### 4.1 Mailgun Email

1. Зареєструйтеся на https://www.mailgun.com
2. Скопіюйте:
   - Domain: `mg.example.com`
   - API Key: `key-xxxxxxxx`
3. В Firebase Console → Firestore → config → mailgun:

```json
{
  "domain": "mg.example.com",
  "apiKey": "key-xxxxxxxx",
  "fromEmail": "no-reply@example.com"
}
```

### 4.2 Twilio SMS

1. Зареєструйтеся на https://www.twilio.com
2. Скопіюйте:
   - Account SID: `AC...`
   - Auth Token: `...`
   - Phone Number: `+1234567890`
3. В Firestore → config → twilio:

```json
{
  "accountSid": "AC...",
  "authToken": "...",
  "fromPhone": "+1234567890"
}
```

### 4.3 Nova Poshta

1. Зареєструйтеся на https://new.novaposhta.ua/
2. Отримайте API Key (TTN Gen 2)
3. В Firestore → config → novaPoshta:

```json
{
  "apiKey": "your-api-key",
  "url": "https://api.novaposhta.ua/v2.0/"
}
```

### 4.4 Telegram Bot

1. Створіть бота у @BotFather
2. Скопіюйте Bot Token
3. В Firestore → config → telegram:

```json
{
  "botToken": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
  "chatId": "-1001234567890"
}
```

### 4.5 Платежні системи

#### Monobank
```json
{
  "apiKey": "your-api-key",
  "xToken": "your-x-token"
}
```

#### LiqPay
```json
{
  "merchantId": "your-merchant-id",
  "publicKey": "your-public-key",
  "privateKey": "your-private-key"
}
```

### 4.6 Резервні копії

#### Google Drive
```json
{
  "folderId": "your-folder-id",
  "apiKey": "your-api-key"
}
```

#### AWS S3
```json
{
  "bucket": "your-bucket-name",
  "accessKeyId": "your-access-key",
  "secretAccessKey": "your-secret-key",
  "region": "eu-west-1"
}
```

#### Dropbox
```json
{
  "accessToken": "sl.your-token",
  "folderPath": "/SVAROG/backups"
}
```

---

## ФАЗА 5: TELEGRAM BOT DEPLOYMENT

### 5.1 На Render (Cloud Hosting)

1. Зареєструйтеся на https://render.com
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - Name: `svarog-bot`
   - Environment: Python 3.11
   - Build: `pip install -r requirements.txt`
   - Start: `python bot.py`
5. Environment variables:
   ```
   BOT_TOKEN=123456789:ABCdefGHIjklMNO
   ADMIN_CHAT_ID=-1001234567890
   WEBHOOK_SECRET=your-webhook-secret
   RENDER_EXTERNAL_URL=https://svarog-bot.render.com
   PORT=10000
   ```
6. Deploy

### 5.2 Налаштуйте Webhook

```bash
curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
  -F url=https://svarog-bot.render.com/webhook \
  -F allowed_updates='["message", "callback_query"]'
```

### 5.3 Перевірте

```bash
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```

Повинна бути відповідь:
```json
{
  "ok": true,
  "result": {
    "url": "https://svarog-bot.render.com/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

---

## ФАЗА 6: ELECTRON APP BUILD

### 6.1 Локально (тест)

```bash
npm install
npm run build:win
npm run build:mac
```

### 6.2 Через GitHub Actions (production)

1. Просто пушніть на main:
```bash
git add .
git commit -m "Release v3.0.0"
git push origin main
```

2. GitHub Actions автоматично:
   - Вбудує для Windows
   - Вбудує для macOS
   - Завантажує в Releases

3. Завантажиться:
   - `svarog-center-setup-3.0.0.exe` (Windows)
   - `svarog-center-3.0.0.dmg` (macOS)

---

## ФАЗА 7: WEBHOOKS SETUP

### 7.1 Monobank Webhook

1. Мобільний додаток Monobank → Налаштування
2. Webhooks → Create webhook
3. URL: `https://your-domain.com/monobank-webhook`
4. Тип: JSON

### 7.2 LiqPay Webhook

1. https://www.liqpay.ua → Налаштування мерчанта
2. Webhook URL: `https://your-domain.com/liqpay-webhook`
3. Версія API: latest

### 7.3 Nova Poshta Webhook (опціонально)

1. https://new.novaposhta.ua/
2. Webhooks → Create webhook
3. URL: `https://your-domain.com/novaposhta-webhook`

---

## ФАЗА 8: PRODUCTION SECURITY

### 8.1 HTTPS Сертифікат

Вас потрібен HTTPS для webhooks!

#### Вільний: Let's Encrypt + Certbot

```bash
sudo certbot certonly --standalone -d your-domain.com
```

#### Платний: AWS Certificate Manager, Cloudflare, тощо

### 8.2 Firestore Security

Переконайтеся, що правила desarrollo:

1. Config keys видимі ТІЛЬКИ Super Admin
2. Операції логуються
3. Користувачі не можуть видалити дані без прав
4. Public collections (news, merch) доступні всім

```bash
firebase deploy --only firestore:rules
```

### 8.3 API Rate Limits

Cloud Functions має rate limits:
- 100 API calls/min
- 50 email/day
- 100 SMS/day

Налаштуйте в constants.js:

```javascript
const RATE_LIMITS = {
  API_CALL: 100,
  EMAIL_SEND: 50,
  SMS_SEND: 100
};
```

### 8.4 Резервні копії

Переконайтеся, що резервні копії працюють:

```bash
firebase functions:log
# Шукайте "backup_created"
```

---

## ФАЗА 9: MONITORING & ALERTS

### 9.1 Firebase Monitoring

1. Firebase Console → Alerts
2. Create alerts for:
   - High error rate
   - High latency
   - Quota exceeded

### 9.2 Sentry (Error Tracking)

1. Зареєструйтеся на https://sentry.io
2. Create project: Node.js
3. Отримайте Sentry DSN
4. В Cloud Functions:

```javascript
const Sentry = require("@sentry/node");
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

### 9.3 Logs

Переглядайте логи:

```bash
# Firebase Cloud Functions
firebase functions:log

# Telegram Bot (Render)
https://dashboard.render.com/services/svarog-bot

# Firestore Rules
firebase emulators:start --only firestore
```

---

## ФАЗА 10: TESTING

### 10.1 Email Test

```bash
curl -X POST https://your-domain.com/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "subject": "Test"}'
```

### 10.2 SMS Test

```bash
curl -X POST https://your-domain.com/api/test-sms \
  -H "Content-Type: application/json" \
  -d '{"to": "+380123456789", "message": "Test"}'
```

### 10.3 Telegram Test

```bash
curl -X POST https://api.telegram.org/bot<TOKEN>/sendMessage \
  -H "Content-Type: application/json" \
  -d '{"chat_id": -1001234567890, "text": "Test message"}'
```

### 10.4 Payment Test

Create test order:
```bash
curl -X POST https://your-domain.com/api/test-payment \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ORD-001", "amount": 100}'
```

---

## 🎉 PRODUCTION CHECKLIST

Перед запуском на production:

- [ ] Firestore rules розгорнені
- [ ] Cloud Functions розгорнені
- [ ] Telegram Bot запущений на Render
- [ ] Mailgun налаштований
- [ ] Twilio налаштований
- [ ] Nova Poshta налаштований
- [ ] Monobank webhook налаштований
- [ ] LiqPay webhook налаштований
- [ ] HTTPS сертифікат встановлений
- [ ] GitHub Actions CI/CD працює
- [ ] Electron app вбудований
- [ ] Резервні копії налаштовані
- [ ] Логування функціонує
- [ ] Monitoring активований
- [ ] Адмін створений в Firestore
- [ ] Перші користувачі додані

---

## 🐛 QUICK TROUBLESHOOTING

### "Cloud Functions deployment failed"
```bash
firebase deploy --only functions --debug
```

### "Firestore rules rejected"
```bash
firebase emulators:start --only firestore
# Перевірте /rules tab
```

### "Telegram webhook not working"
```bash
# Перевірте webhook
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Відновіть webhook
curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
  -F url=https://svarog-bot.render.com/webhook
```

### "Electron app not updating"
- Переконайтеся, що GH_TOKEN в Secrets
- Проверьте GitHub Releases (повинна бути v3.0.0)
- Check app logs в `%APPDATA%/SVAROG/logs/`

---

## 📞 SUPPORT

- **GitHub Issues:** https://github.com/YOUR_USERNAME/svarog-center-v3/issues
- **Firebase Docs:** https://firebase.google.com/docs
- **Telegram Docs:** https://core.telegram.org/bots/api

---

**Успішного розгортання! 🚀**
