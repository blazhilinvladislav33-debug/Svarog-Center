# 🔐 SVAROG Firestore Rules v3.0.0

## Огляд системи ролей

```
Super Admin (супер-адмін)
├─ Всі налаштування
├─ Керування адмінами
├─ Видалення даних
├─ Перегляд логів

Moderator (модератор)
├─ Керування товарами, новинами
├─ Керування замовленнями
├─ Керування звернення
├─ ❌ Не бачить конфіг-ключи
├─ ❌ Не може видаляти

Operator (оператор)
├─ Оновлення статусу замовлення
├─ Перегляд замовлень
├─ Додавання примітки
├─ ❌ Не може видаляти
├─ ❌ Не може змінювати налаштування
└─ ❌ Не бачить ключі платежів
```

---

## 📋 Колекції & Правила Доступу

### 1. **admins** — Керування адмінами
```
Role: Super Admin тільки
Структура:
{
  email: "admin@example.com",
  name: "Admin Name",
  role: "super_admin|moderator|operator",
  2fa_enabled: true,
  created_at: timestamp,
  last_login: timestamp
}

Дозволи:
├─ READ: Super Admin або сам користувач
├─ CREATE: Super Admin тільки
├─ UPDATE: Super Admin або сам (окрім ролі)
└─ DELETE: Super Admin тільки
```

### 2. **config/** — Конфігурація
```
Підколекції:
├─ config/telegram      (read: Admin, write: Super Admin)
├─ config/novaPoshta    (read: Admin, write: Super Admin)
├─ config/payments      (read: Super Admin, write: Super Admin)
├─ config/email         (read: Super Admin, write: Super Admin)
├─ config/sms           (read: Super Admin, write: Super Admin)
└─ config/analytics     (read: Admin, write: Cloud Function)

⚠️ КОНФІГ-КЛЮЧИ видимі ТІЛЬКИ Super Admin!
```

### 3. **orders** — Замовлення
```
Дозволи:
├─ READ: Admin тільки
├─ CREATE: Публічно (клієнти)
├─ UPDATE: Operator+ (можуть менювати статус)
└─ DELETE: Super Admin тільки

Дочірні колекції:
└─ orders/{id}/comments   (Admin тільки)
```

### 4. **feedback** — Звернення
```
Дозволи:
├─ READ: Admin тільки
├─ CREATE: Публічно (клієнти)
├─ UPDATE: Moderator+ (змінювати статус/відповідь)
└─ DELETE: Super Admin тільки
```

### 5. **customers** — CRM клієнти
```
Дозволи:
├─ READ: Admin тільки
├─ CREATE: Moderator+
├─ UPDATE: Operator+ (базова інформація)
└─ DELETE: Super Admin тільки

Структура:
{
  phone: "380501234567",
  email: "customer@example.com",
  name: "John Doe",
  address: "....",
  notes: "...",
  tags: ["vip", "repeat"],
  loyalty_points: 100,
  orders_count: 5
}
```

### 6. **campaigns** — Marketing
```
Дозволи:
├─ READ: Admin тільки
├─ CREATE: Moderator+
├─ UPDATE: Moderator+
└─ DELETE: Super Admin тільки

Типи:
├─ email_campaign
├─ sms_campaign
└─ push_campaign
```

### 7. **admin_logs** — Логування дій
```
Дозволи:
├─ READ: Moderator+ (для аудиту)
├─ CREATE: Автоматично при змінах
└─ DELETE: Super Admin тільки

Структура:
{
  admin_email: "admin@example.com",
  action: "order_status_changed",
  details: {...},
  timestamp: timestamp,
  ip_address: "..."
}
```

### 8. **Public Collections** (для сайту)
```
├─ news         (read: PUBLIC, write: Moderator+)
├─ merch        (read: PUBLIC, write: Moderator+)
├─ hub_links    (read: PUBLIC, write: Moderator+)
└─ reports      (read: PUBLIC, write: Moderator+)
```

---

## 🔄 Функції Безпеки

### Helper Functions:

```firestore
isAdmin()
├─ Перевіряє чи є email в колекції admins

getUserRole()
├─ Повертає роль користувача

isSuperAdmin()
├─ Перевіряє чи role == 'super_admin'

isModerator()
├─ Перевіряє чи role == 'super_admin' або 'moderator'

isOperator()
├─ Перевіряє чи role in ['super_admin', 'moderator', 'operator']
```

---

## 🛡️ Безпека Конфіг-Ключів

**Критично важливо:** Конфіг-ключи **НІКОЛИ** не відправляються клієнту!

```
❌ НЕПРАВИЛЬНО:
├─ Зберігати в localStorage
├─ Відправляти в браузер
└─ Експортувати у публічні файли

✅ ПРАВИЛЬНО:
├─ Читати тільки на Backend (Cloud Functions)
├─ Жодні ключи не видимі Moderators
├─ Логування доступу до ключів
└─ Ротація ключів щомісяця
```

### Перевірка Доступу:

```firestore
match /config/payments {
  // Super Admin тільки бачить платежі!
  allow read: if isSuperAdmin();
  
  // Modifier не має доступу
  allow read: if isModerator(); // ❌ DENIED!
}
```

---

## 📊 Структура Документів

### orders
```json
{
  "id": "order_123",
  "name": "John Doe",
  "phone": "+380501234567",
  "email": "john@example.com",
  "items": [
    {
      "id": "merch_1",
      "name": "T-Shirt",
      "quantity": 2,
      "price": 500
    }
  ],
  "total": 1000,
  "status": "pending|confirmed|shipped|delivered|cancelled",
  "payment_method": "monobank|cash",
  "delivery_method": "nova_poshta|courier|pickup",
  "tracking_number": "",
  "admin_notes": "",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### customers
```json
{
  "id": "cust_123",
  "phone": "+380501234567",
  "email": "customer@example.com",
  "name": "John Doe",
  "address": "...",
  "notes": "VIP customer",
  "tags": ["vip", "repeat", "newsletter"],
  "loyalty_points": 150,
  "orders_count": 5,
  "total_spent": 5000,
  "created_at": "timestamp",
  "last_purchase": "timestamp"
}
```

### campaigns
```json
{
  "id": "campaign_123",
  "name": "Summer Sale 2026",
  "type": "email|sms|push",
  "status": "draft|scheduled|sent",
  "template": "template_id",
  "recipients_count": 1000,
  "sent_at": "timestamp",
  "statistics": {
    "sent": 1000,
    "opened": 250,
    "clicked": 75,
    "converted": 15
  }
}
```

---

## ⚙️ Розгортання Rules

### Через Firebase CLI:
```bash
firebase login
firebase deploy --only firestore:rules
```

### Через Firebase Console:
1. Йди на https://console.firebase.google.com
2. Firestore Database → Rules
3. Вставь вміст firestore.rules
4. Натисни "Publish"

### Тестування Rules:
```bash
firebase emulators:start --only firestore
# Тестуй локально перед публікацією
```

---

## 🔔 Audit Trail (Логування)

Кожна дія адміна логується в `admin_logs`:

```json
{
  "admin_email": "admin@example.com",
  "action_type": "order_status_changed",
  "collection": "orders",
  "document_id": "order_123",
  "old_value": "pending",
  "new_value": "shipped",
  "timestamp": "2026-08-17T10:30:00Z",
  "ip_address": "192.168.1.1",
  "user_agent": "..."
}
```

---

## 🚨 Порушення Безпеки

**Якщо користувач спробує:**

```
❌ Читати конфіг платежів без Super Admin
   → DENIED - Permission denied

❌ Видаляти замовлення без Super Admin
   → DENIED - Permission denied

❌ Менювати чужу роль
   → DENIED - Permission denied

❌ Доступити до admin_logs без Moderator+
   → DENIED - Permission denied
```

---

## 📝 Чеклист Безпеки

- ✅ Super Admin має все
- ✅ Moderator НЕ бачить ключі
- ✅ Operator НЕ може видаляти
- ✅ Public data видима всім
- ✅ Private data видима адмінам
- ✅ Конфіг-ключи видимі ТІЛЬКИ Super Admin
- ✅ Логування всіх дій
- ✅ IP блокування (реалізується в Cloud Functions)

---

## 🔄 Оновлення Rules

Коли додаєш нову колекцію:

1. Додай в `firestore.rules`
2. Запусти `firebase deploy --only firestore:rules`
3. Протестуй в консолі
4. Логуй у `admin_logs`

---

**Правила активні! 🔒**
