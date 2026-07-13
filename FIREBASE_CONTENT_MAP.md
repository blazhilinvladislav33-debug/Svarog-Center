# SVAROG — довідник Firebase: контент сайту

Все, що сайт (svarog-team-main) реально читає/пише у Firestore, зіставлено з правилами
з `firestore.rules`. Код підтягування контенту вже є в HTML-файлах сайту (він написаний
напряму на JS у кожній сторінці, окремих "функцій" типу Cloud Functions для читання не
потрібно — Cloud Function писали тільки для approveAdminRequest, бо там треба було
створювати чужий акаунт, а це можна лише на сервері).

## Публічні дані (читання дозволене всім, `allow read: if true`)

| Колекція | Хто читає (сторінка) | Як |
|---|---|---|
| `merch` | shop.html | `db.collection("merch").onSnapshot(...)` — весь каталог товарів, live-оновлення |
| `news` | about.html | `db.collection("news").orderBy("date","desc").onSnapshot(...)` |
| `reports` | support.html | `db.collection("reports").orderBy("timestamp","desc").onSnapshot(...)` |
| `promocodes` | shop.html (перевірка коду при оформленні) | — |
| `config/payment` | shop.html, support.html | реквізити (банка, картка) |
| `config/shop` | shop.html | банер, вкл/викл магазину |
| `config/statistics` | index.html | цифри на головній |
| `config/socials` | index.html, about.html, contact.html, report.html, support.html | іконки соцмереж у футері |
| `config/combat_report` | report.html | бойовий звіт SVAROG |
| `hub_links` | links.html | `.where("active","==",true).onSnapshot(...)` — мультипосилання |
| `admins` | нікуди на сайті не читається публічно (це для checkAdminAccess в адмінці) |

## Дані від відвідувача (тільки `create`)

| Колекція | Хто пише | Сторінка |
|---|---|---|
| `orders` | оформлення замовлення | shop.html |
| `volunteers` | анкета волонтера | support.html (форма) |
| `feedback` | форма звернення | contact.html |
| `hub_clicks` | клік по посиланню в хабі | links.html |
| `admin_requests` | запит на доступ адміну | auth.html |

## Змішане читання+запис (публічно, навмисно)

| Колекція | Логіка |
|---|---|
| `orders` | `create: true` — оформлення; `read: true` — потрібно для **status.html**, який шукає замовлення по телефону (`where("phone","==",...)`). Без цього права пошук статусу завжди повертав "заборонено". |
| `chats` | анонімний чат підтримки: відвідувач і без акаунту читає/пише свій документ `chats/{userChatSessionId}` (id генерується локально в браузері й зберігається в localStorage) |

## Доступ тільки для адмінів (`isAdmin()`)

Все інше — `admin_logs`, запис/видалення `merch`/`news`/`config`/`hub_links`/`promocodes`,
читання й обробка `orders`/`volunteers`/`feedback`/`admin_requests`/`hub_clicks` — керується
через `admin.html` (Electron-апку), захищене функцією:

```
function isAdmin() {
  return request.auth != null &&
         exists(/databases/$(database)/documents/admins/$(request.auth.token.email.lower()));
}
```

## Схвалення нових адмінів (безкоштовний варіант, без сервера)

Новий адмін сам придумує собі пароль ще на кроці "ЗАПИТ ДОСТУПУ" (`auth.html` →
`auth.createUserWithEmailAndPassword(email, pass)`) — акаунт у Firebase Auth
створюється одразу, просто без прав. Коли існуючий адмін тисне "Схвалити",
`approveAdmin()` лише записує роль у `admins/{email}` і видаляє заявку —
пароль нікуди пересилати не треба, бо людина вже його знає (сама ввела).
Це не вимагає ні Cloud Function, ні плану Blaze, ні жодних витрат.

## Що деплоїти

```bash
cd Svarog-Center
firebase deploy --only firestore:rules
```
або через Firebase Console → Firestore Database → Rules → вставити
вміст `firestore.rules` → Publish. (`functions/` більше не використовується —
безкоштовний варіант обходиться без Cloud Function і без плану Blaze.)
