# 💬 Chat & Media Integration Guide - SVAROG v3.1.0

Повний посібник для впровадження функцій чатів та управління мультимедіа в SVAROG.

---

## 📋 Що включено

- ✅ **Чати між користувачами** (real-time messaging)
- ✅ **Фотографії замовлень** (photo upload & storage)
- ✅ **Фотографії клієнтів** (profile pictures)
- ✅ **Центральне сховище мультимедіа** (media library)
- ✅ **Повідомлення в реальному часі** (live notifications)
- ✅ **Мігрування старих даних** (photos, chats from legacy systems)

---

## 🗂️ Структура БД

### Chats Collection

```
chats/
├─ {chatId}/
│   ├─ participants: [userId1, userId2, ...]
│   ├─ subject: string
│   ├─ created_at: timestamp
│   ├─ updated_at: timestamp
│   └─ messages/ (subcollection)
│       └─ {messageId}/
│           ├─ sender_id: string
│           ├─ text: string
│           ├─ created_at: timestamp
│           └─ migrated: boolean (опціонально)
```

### Media Collection

```
media/
└─ {mediaId}/
    ├─ url: string (Firebase Storage link)
    ├─ title: string
    ├─ type: 'image' | 'document' | 'video' | 'other'
    ├─ size: number (bytes)
    ├─ mime_type: string
    ├─ uploaded_by: string (user UID)
    ├─ created_at: timestamp
    └─ migrated: boolean (опціонально)
```

### Photos Subcollections

```
orders/{orderId}/photos/
├─ {photoId}/
│   ├─ url: string
│   ├─ title: string
│   ├─ created_at: timestamp
│   └─ migrated: boolean

customers/{customerId}/photos/
├─ {photoId}/
│   ├─ url: string
│   ├─ title: string
│   ├─ created_at: timestamp
│   └─ migrated: boolean
```

---

## 💻 API Functions

### Чати

#### `createChat(participants, subject)`
Створити новий чат

```javascript
import { createChat } from './firebase-config.js';

const chatId = await createChat(['user1', 'user2'], 'Order Discussion');
console.log('Chat created:', chatId);
```

#### `getUserChats(userId)`
Отримати всі чати користувача

```javascript
const chats = await getUserChats('user123');
console.log('User chats:', chats);
// [
//   { id: 'chat1', participants: [...], subject: 'Order' },
//   { id: 'chat2', participants: [...], subject: 'Support' }
// ]
```

#### `getChatMessages(chatId)`
Отримати повідомлення з чату

```javascript
const messages = await getChatMessages('chat123');
console.log('Messages:', messages);
// [
//   { id: 'msg1', sender_id: 'user1', text: 'Hello', created_at: ... },
//   { id: 'msg2', sender_id: 'user2', text: 'Hi', created_at: ... }
// ]
```

#### `sendMessage(chatId, senderId, text)`
Відправити повідомлення

```javascript
const messageId = await sendMessage('chat123', 'user123', 'Hello everyone!');
console.log('Message sent:', messageId);
```

#### `listenToChatMessages(chatId, callback)`
Слухати повідомлення в реальному часі

```javascript
const unsubscribe = listenToChatMessages('chat123', (messages) => {
  console.log('Messages updated:', messages);
  // Автоматично оновлюється коли хтось напише
});

// Для вимкнення слухача:
// unsubscribe();
```

#### `deleteMessage(chatId, messageId)`
Видалити повідомлення

```javascript
await deleteMessage('chat123', 'msg123');
console.log('Message deleted');
```

### Мультимедіа

#### `uploadMedia(file, uploadedBy, mediaType)`
Завантажити файл

```javascript
import { uploadMedia } from './firebase-config.js';

const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];

const result = await uploadMedia(file, 'user123', 'image');
console.log('Uploaded:', result);
// { id: 'media123', url: 'https://...', name: 'photo.jpg' }
```

#### `addOrderPhoto(orderId, photoUrl, title)`
Додати фото до замовлення

```javascript
const photoId = await addOrderPhoto('order123', 'https://...', 'Product photo');
console.log('Photo added:', photoId);
```

#### `getOrderPhotos(orderId)`
Отримати фото замовлення

```javascript
const photos = await getOrderPhotos('order123');
console.log('Order photos:', photos);
// [
//   { id: 'photo1', url: 'https://...', title: 'Product photo' },
//   { id: 'photo2', url: 'https://...', title: 'Packaging' }
// ]
```

#### `addCustomerPhoto(customerId, photoUrl, title)`
Додати фото до клієнта

```javascript
const photoId = await addCustomerPhoto('customer123', 'https://...', 'Profile photo');
console.log('Photo added:', photoId);
```

#### `getCustomerPhotos(customerId)`
Отримати фото клієнта

```javascript
const photos = await getCustomerPhotos('customer123');
```

---

## 🎨 UI Integration Examples

### 1. Chat Widget

```html
<!-- HTML -->
<div id="chatContainer">
  <div id="messages" class="messages"></div>
  <input id="messageInput" type="text" placeholder="Type message...">
  <button onclick="sendMsg()">Send</button>
</div>

<script type="module">
  import { 
    listenToChatMessages, 
    sendMessage,
    getCurrentUser 
  } from './firebase-config.js';

  const chatId = 'chat123';
  const currentUser = getCurrentUser();

  // Listen to messages
  listenToChatMessages(chatId, (messages) => {
    const container = document.getElementById('messages');
    container.innerHTML = messages.map(msg => `
      <div class="message ${msg.sender_id === currentUser.uid ? 'sent' : 'received'}">
        <p>${msg.text}</p>
        <small>${new Date(msg.created_at.toDate()).toLocaleTimeString()}</small>
      </div>
    `).join('');
  });

  // Send message
  window.sendMsg = async () => {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (text) {
      await sendMessage(chatId, currentUser.uid, text);
      input.value = '';
    }
  };
</script>

<style>
  #chatContainer {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    height: 400px;
    display: flex;
    flex-direction: column;
  }

  #messages {
    flex: 1;
    overflow-y: auto;
    margin-bottom: 10px;
  }

  .message {
    margin: 5px 0;
    padding: 8px 12px;
    border-radius: 8px;
    max-width: 80%;
  }

  .message.sent {
    background: #007bff;
    color: white;
    margin-left: auto;
  }

  .message.received {
    background: #f0f0f0;
  }
</style>
```

### 2. Photo Upload

```html
<!-- HTML -->
<div id="photoUpload">
  <input id="photoInput" type="file" accept="image/*">
  <button onclick="uploadPhoto()">Upload Photo</button>
  <div id="photoGallery" class="gallery"></div>
</div>

<script type="module">
  import { 
    uploadMedia, 
    getOrderPhotos,
    getCurrentUser 
  } from './firebase-config.js';

  const orderId = 'order123';
  const currentUser = getCurrentUser();

  // Load existing photos
  async function loadPhotos() {
    const photos = await getOrderPhotos(orderId);
    const gallery = document.getElementById('photoGallery');
    gallery.innerHTML = photos.map(photo => `
      <img src="${photo.url}" alt="${photo.title}" style="max-width: 150px; margin: 5px;">
    `).join('');
  }

  // Upload new photo
  window.uploadPhoto = async () => {
    const input = document.getElementById('photoInput');
    const file = input.files[0];

    if (file) {
      const result = await uploadMedia(file, currentUser.uid, 'image');
      console.log('Photo uploaded:', result.url);
      loadPhotos(); // Refresh gallery
      input.value = '';
    }
  };

  loadPhotos(); // Initial load
</script>

<style>
  #photoGallery {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
    margin-top: 15px;
  }
</style>
```

---

## 📥 Migration Examples

### Мігрування чатів

**chats.json:**
```json
[
  {
    "participants": ["user1@example.com", "user2@example.com"],
    "subject": "Order #123 Discussion",
    "messages": [
      {
        "sender_id": "user1@example.com",
        "text": "Is this product available?",
        "created_at": "2024-01-15T10:30:00Z"
      },
      {
        "sender_id": "user2@example.com",
        "text": "Yes, it is!",
        "created_at": "2024-01-15T10:35:00Z"
      }
    ],
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

**Мігрування:**
```bash
node data-migration.js --type chats --file chats.json
```

### Мігрування фото

**photos.json:**
```json
[
  {
    "url": "https://old-site.com/photos/product1.jpg",
    "order_id": "ORDER_123",
    "title": "Product Photo",
    "type": "image",
    "created_at": "2024-01-10T15:20:00Z"
  },
  {
    "url": "https://old-site.com/photos/avatar.jpg",
    "customer_id": "CUST_456",
    "title": "Profile Photo",
    "type": "image",
    "created_at": "2024-01-05T12:00:00Z"
  }
]
```

**Мігрування:**
```bash
node data-migration.js --type photos --file photos.json
```

---

## 🔒 Безпека

### Правила для чатів

```
match /chats/{chatId} {
  // Користувачі можуть читати чати де вони учасник
  allow read: if request.auth.uid in resource.data.participants;

  // Тільки учасники можуть писати повідомлення
  match /messages/{messageId} {
    allow create: if request.auth != null
      && request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants
      && request.resource.data.sender_id == request.auth.uid;
  }
}
```

### Правила для мультимедіа

```
// Storage Rules
match /media/{allPaths=**} {
  // Читати: всі автентичні користувачи
  allow read: if request.auth != null;

  // Писати: тільки файли до 10MB
  allow write: if request.auth != null 
    && request.resource.size < 10 * 1024 * 1024;
}
```

---

## ⚡ Performance Tips

### 1. Pagination для чатів

```javascript
import { query, collection, orderBy, limit, startAfter } from 'firebase/firestore';

const pageSize = 20;
let lastVisible = null;

async function loadMoreMessages(chatId) {
  let q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('created_at', 'desc'),
    limit(pageSize)
  );

  if (lastVisible) {
    q = query(q, startAfter(lastVisible));
  }

  const snapshot = await getDocs(q);
  lastVisible = snapshot.docs[snapshot.docs.length - 1];
  
  return snapshot.docs.reverse().map(doc => ({ id: doc.id, ...doc.data() }));
}
```

### 2. Кешування фото

```javascript
// Використовувати IndexedDB для кешування URL
const cacheKey = `photo_${orderId}`;
const cached = localStorage.getItem(cacheKey);

if (cached) {
  displayPhotos(JSON.parse(cached));
} else {
  const photos = await getOrderPhotos(orderId);
  localStorage.setItem(cacheKey, JSON.stringify(photos));
  displayPhotos(photos);
}
```

### 3. Стиснення фото перед завантаженням

```javascript
async function compressAndUpload(file) {
  // Використовувати image-compressor.js
  const compressor = new Compressor(file, {
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1920,
    success(result) {
      uploadMedia(result, userId, 'image');
    }
  });
}
```

---

## 🧪 Testing

### Unit Tests для чатів

```javascript
import { createChat, sendMessage, getChatMessages } from './firebase-config.js';

describe('Chat Functions', () => {
  test('should create chat with participants', async () => {
    const chatId = await createChat(['user1', 'user2'], 'Test Chat');
    expect(chatId).toBeDefined();
  });

  test('should send message', async () => {
    const chatId = await createChat(['user1', 'user2']);
    const msgId = await sendMessage(chatId, 'user1', 'Hello');
    expect(msgId).toBeDefined();
  });

  test('should get all messages', async () => {
    const chatId = await createChat(['user1', 'user2']);
    await sendMessage(chatId, 'user1', 'Test 1');
    await sendMessage(chatId, 'user2', 'Test 2');
    
    const messages = await getChatMessages(chatId);
    expect(messages.length).toBe(2);
  });
});
```

---

## 📊 Monitoring

### Firebase Console Insights

```
Firebase Console
└─ Firestore → Insights

Моніторити:
  • Connections active (live chats)
  • Document writes/sec (messages sent)
  • Document reads/sec (message loads)
  • Slowest operations (optimize queries)
```

### Usage Analytics

```javascript
// Log chat analytics
import { updateDoc, doc } from 'firebase/firestore';

async function logChatActivity(chatId, action) {
  const analyticsRef = doc(db, 'analytics', 'chat_activity');
  await updateDoc(analyticsRef, {
    [`${action}_count`]: increment(1),
    last_activity: new Date()
  });
}
```

---

## 🆘 Troubleshooting

### ❌ Chat не з'являється

```
✓ Перевірте користувач є в participants array
✓ Перевірте firestore.rules дозволяє читати
✓ Перевірте subscriber активний (не unsubscribe)
```

### ❌ Фото не завантажується

```
✓ Перевірте Firebase Storage rules
✓ Перевірте размір файлу < 10MB
✓ Перевірте URL дійсний (не хорошо)
```

### ❌ Затримка повідомлень

```
✓ Скоротіть розмір документів
✓ Використовуйте pagination для старих повідомлень
✓ Перевірте internet connection
```

---

## 📞 Support

- **Firebase Chat**: https://firebase.google.com/docs/firestore/query-data/order-limit-data
- **Storage**: https://firebase.google.com/docs/storage
- **Realtime Updates**: https://firebase.google.com/docs/firestore/query-data/listen

**Успішної роботи з чатами та мультимедіа! 💬📸**
