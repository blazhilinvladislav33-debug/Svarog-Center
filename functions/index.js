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


// ═══════════════════════════════════════════════════════════════════════
// РОЗСИЛКИ EMAIL / SMS  (SVAROG v3.1.0)
//
// Адмінка лише створює документ у campaigns зі статусом "queued".
// Ця функція його підхоплює і виконує відправку. Ключі Mailgun/Twilio
// живуть тільки тут, у браузер не потрапляють.
//
// Налаштування (Firebase Console → Functions → Environment variables):
//   MAILGUN_API_KEY, MAILGUN_DOMAIN, MAIL_FROM
//   TWILIO_SID, TWILIO_TOKEN, TWILIO_PHONE
// ═══════════════════════════════════════════════════════════════════════

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || "";
const MAILGUN_DOMAIN  = process.env.MAILGUN_DOMAIN  || "";
const MAIL_FROM       = process.env.MAIL_FROM       || "SVAROG <noreply@svarog.team>";

const TWILIO_SID   = process.env.TWILIO_SID   || "";
const TWILIO_TOKEN = process.env.TWILIO_TOKEN || "";
const TWILIO_PHONE = process.env.TWILIO_PHONE || "";

/** Підставляє {name}, {orderId} тощо у текст шаблону */
function applyVariables(text, recipient) {
  if (!text) return "";
  const values = {
    "{name}":      recipient.name  || "друже",
    "{email}":     recipient.email || "",
    "{phone}":     recipient.phone || "",
    "{orderId}":   recipient.orderId   || "",
    "{total}":     recipient.total     || "",
    "{status}":    recipient.status    || "",
    "{ttn}":       recipient.ttn       || "",
    "{promocode}": recipient.promocode || ""
  };
  return Object.keys(values).reduce(
    (acc, key) => acc.split(key).join(values[key]),
    text
  );
}

async function sendEmail(to, subject, body) {
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    throw new Error("Mailgun не налаштований (MAILGUN_API_KEY / MAILGUN_DOMAIN)");
  }
  const params = new URLSearchParams();
  params.append("from", MAIL_FROM);
  params.append("to", to);
  params.append("subject", subject || "Повідомлення від SVAROG");
  params.append("text", body);

  await axios.post(
    `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
    params,
    { auth: { username: "api", password: MAILGUN_API_KEY }, timeout: 20000 }
  );
}

async function sendSms(to, body) {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_PHONE) {
    throw new Error("Twilio не налаштований (TWILIO_SID / TWILIO_TOKEN / TWILIO_PHONE)");
  }
  const params = new URLSearchParams();
  params.append("From", TWILIO_PHONE);
  params.append("To", to);
  params.append("Body", body);

  await axios.post(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
    params,
    { auth: { username: TWILIO_SID, password: TWILIO_TOKEN }, timeout: 20000 }
  );
}

/**
 * Обробляє нову кампанію зі статусом "queued".
 * Відправляє пачками по 20, щоб не впертись у ліміти провайдерів.
 */
exports.processCampaign = functions
  .runWith({ timeoutSeconds: 540, memory: "512MB" })
  .firestore.document("campaigns/{campaignId}")
  .onCreate(async (snap) => {
    const campaign = snap.data();
    if (campaign.status !== "queued") return null;

    const recipients = Array.isArray(campaign.recipients) ? campaign.recipients : [];
    if (!recipients.length) {
      await snap.ref.update({ status: "failed", error: "Список отримувачів порожній" });
      return null;
    }

    await snap.ref.update({ status: "sending", startedAt: Date.now() });

    let sent = 0;
    let failed = 0;
    const errors = [];
    const BATCH = 20;

    for (let i = 0; i < recipients.length; i += BATCH) {
      const chunk = recipients.slice(i, i + BATCH);

      await Promise.all(chunk.map(async (r) => {
        try {
          const body = applyVariables(campaign.body, r);
          if (campaign.type === "sms") {
            if (!r.phone) throw new Error("немає телефону");
            await sendSms(r.phone, body);
          } else {
            if (!r.email) throw new Error("немає email");
            await sendEmail(r.email, applyVariables(campaign.subject, r), body);
          }
          sent++;
        } catch (e) {
          failed++;
          if (errors.length < 20) {
            errors.push(`${r.email || r.phone}: ${e.message}`);
          }
        }
      }));

      await snap.ref.update({ sentCount: sent, failedCount: failed });
      // пауза між пачками — бережемо ліміти
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    await snap.ref.update({
      status: failed === recipients.length ? "failed" : "sent",
      sentCount: sent,
      failedCount: failed,
      errors: errors,
      finishedAt: Date.now()
    });

    // Звіт у Telegram
    if (TELEGRAM_BOT_TOKEN) {
      try {
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
          chat_id: ADMIN_CHAT_ID,
          parse_mode: "HTML",
          text: `📣 <b>Розсилка завершена</b>\n\n` +
                `Шаблон: ${campaign.templateName || "—"}\n` +
                `Тип: ${campaign.type === "sms" ? "SMS" : "Email"}\n` +
                `✅ Надіслано: ${sent}\n` +
                `❌ Помилок: ${failed}`
        });
      } catch (e) { /* звіт не критичний */ }
    }

    return null;
  });

/**
 * Автоматична резервна копія раз на добу о 03:00 за Києвом.
 * Пише знімок основних колекцій у колекцію backups_data.
 */
exports.scheduledBackup = functions
  .runWith({ timeoutSeconds: 540, memory: "1GB" })
  .pubsub.schedule("0 3 * * *")
  .timeZone("Europe/Kyiv")
  .onRun(async () => {
    const collections = [
      "orders", "customers", "chats", "feedback", "merch",
      "promocodes", "volunteers", "recruiting_applications",
      "newsletter_subscribers", "templates", "config"
    ];

    const stamp = new Date().toISOString().slice(0, 10);
    let totalDocs = 0;
    const included = [];

    for (const name of collections) {
      try {
        const snapshot = await db.collection(name).get();
        if (snapshot.empty) continue;

        const docs = [];
        snapshot.forEach((d) => docs.push({ _id: d.id, ...d.data() }));

        // Firestore обмежує документ 1 МБ — ріжемо на частини по 200 записів
        for (let i = 0; i < docs.length; i += 200) {
          await db.collection("backups_data")
            .doc(`${stamp}_${name}_${i / 200}`)
            .set({
              collection: name,
              part: i / 200,
              createdAt: Date.now(),
              docs: JSON.stringify(docs.slice(i, i + 200))
            });
        }

        totalDocs += docs.length;
        included.push(name);
      } catch (e) {
        console.error(`Бекап "${name}" не вдався:`, e.message);
      }
    }

    await db.collection("backups").add({
      filename: `auto-${stamp}`,
      documents: totalDocs,
      collections: included,
      type: "scheduled",
      createdAt: Date.now(),
      createdBy: "system"
    });

    // Прибираємо копії, старші за 30 днів
    const cutoff = Date.now() - 30 * 86400000;
    const old = await db.collection("backups_data")
      .where("createdAt", "<", cutoff).limit(400).get();

    if (!old.empty) {
      const batch = db.batch();
      old.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    console.log(`Резервна копія готова: ${totalDocs} документів`);
    return null;
  });
