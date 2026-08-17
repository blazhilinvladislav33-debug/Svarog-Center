const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

// Telegram Bot API
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "-1004110475608";

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

/**
 * Відправляє Telegram-сповіщення при зміні статусу замовлення
 */
exports.notifyOrderStatusChange = functions.firestore
  .document("orders/{orderId}")
  .onUpdate(async (change, context) => {
    const oldData = change.before.data();
    const newData = change.after.data();

    if (oldData.status === newData.status) {
      return; // Статус не змінився
    }

    const orderId = context.params.orderId;
    const customerPhone = newData.phone || "невідомо";
    const customerName = newData.name || "Клієнт";
    const oldStatus = oldData.status || "новий";
    const newStatus = newData.status;

    // Іконки для статусів
    const statusEmojis = {
      "pending": "⏳",
      "confirmed": "✅",
      "processing": "⚙️",
      "shipped": "📦",
      "delivered": "🎉",
      "cancelled": "❌",
      "refunded": "💰"
    };

    const emoji = statusEmojis[newStatus] || "📋";
    const message = `
${emoji} <b>Змінилась статус замовлення!</b>

<b>ID замовлення:</b> <code>${orderId}</code>
<b>Клієнт:</b> ${customerName}
<b>Телефон:</b> ${customerPhone}
<b>Старий статус:</b> ${oldStatus}
<b>Новий статус:</b> <b>${newStatus}</b>
<b>Час:</b> ${new Date().toLocaleString("uk-UA")}
    `.trim();

    try {
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: "HTML"
      });
      console.log(`✅ Сповіщення про замовлення ${orderId} відправлено`);
    } catch (error) {
      console.error("❌ Помилка при відправці Telegram:", error.message);
    }
  });

/**
 * Відправляє сповіщення при новому звернені
 */
exports.notifyNewFeedback = functions.firestore
  .document("feedback/{feedbackId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const feedbackId = context.params.feedbackId;

    const message = `
🛡 <b>Нове звернення!</b>

<b>ID:</b> <code>${feedbackId}</code>
<b>Від:</b> ${data.name || "Невідомо"}
<b>Email:</b> ${data.email || "не вказано"}
<b>Телефон:</b> ${data.phone || "не вказано"}
<b>Тема:</b> ${data.subject || "без теми"}
<b>Повідомлення:</b>
<pre>${data.message || "(порожньо)"}</pre>
<b>Час:</b> ${new Date().toLocaleString("uk-UA")}
    `.trim();

    try {
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: "HTML"
      });
      console.log(`✅ Сповіщення про звернення ${feedbackId} відправлено`);
    } catch (error) {
      console.error("❌ Помилка при відправці Telegram:", error.message);
    }
  });

/**
 * Відправляє сповіщення при новому замовленні
 */
exports.notifyNewOrder = functions.firestore
  .document("orders/{orderId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const orderId = context.params.orderId;

    let itemsText = "";
    if (data.items && Array.isArray(data.items)) {
      itemsText = data.items
        .map(item => `• ${item.name} x${item.quantity} (${item.price}₴)`)
        .join("\n");
    }

    const message = `
📋 <b>Нове замовлення!</b>

<b>ID:</b> <code>${orderId}</code>
<b>Клієнт:</b> ${data.name || "невідомо"}
<b>Телефон:</b> ${data.phone || "невідомо"}
<b>Email:</b> ${data.email || "не вказано"}
<b>Адреса:</b> ${data.address || "не вказано"}
<b>Товари:</b>
${itemsText || "(порожньо)"}
<b>Сума:</b> ${data.total || "0"}₴
<b>Статус:</b> ${data.status || "очікування"}
<b>Час:</b> ${new Date().toLocaleString("uk-UA")}
    `.trim();

    try {
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: "HTML"
      });
      console.log(`✅ Сповіщення про нове замовлення ${orderId} відправлено`);
    } catch (error) {
      console.error("❌ Помилка при відправці Telegram:", error.message);
    }
  });

/**
 * Тестовий endpoint для перевірки
 */
exports.testNotification = functions.https.onRequest(async (req, res) => {
  const message = `
🧪 <b>Тест Telegram бота</b>

Бот працює і готовий відправляти сповіщення!
Час: ${new Date().toLocaleString("uk-UA")}
    `.trim();

  try {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: ADMIN_CHAT_ID,
      text: message,
      parse_mode: "HTML"
    });
    res.json({ success: true, message: "✅ Тестове сповіщення відправлено" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
