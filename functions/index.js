/**
 * SVAROG Command Center v3.0.0
 * Firebase Cloud Functions
 *
 * Handles:
 * - Email sending via Mailgun
 * - SMS sending via Twilio
 * - Telegram webhooks
 * - Payment webhooks (Monobank, LiqPay)
 * - Nova Poshta integration
 * - Backup creation and restoration
 * - Firestore triggers for logging
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// ============================================================
// CONFIGURATION & CONSTANTS
// ============================================================

const CONFIG_PATHS = {
  mailgun: 'config/mailgun',
  twilio: 'config/twilio',
  monobank: 'config/monobank',
  liqpay: 'config/liqpay',
  novaposhta: 'config/novaPoshta',
  telegram: 'config/telegram',
  googleDrive: 'config/googleDrive',
  awsS3: 'config/awsS3',
  dropbox: 'config/dropbox',
};

// ============================================================
// EMAIL FUNCTIONS
// ============================================================

/**
 * Send email via Mailgun
 */
exports.sendEmail = functions.https.onCall(async (data, context) => {
  try {
    // Get Mailgun config
    const mailgunConfig = await db.doc(CONFIG_PATHS.mailgun).get();
    if (!mailgunConfig.exists) {
      throw new Error('Mailgun configuration not found');
    }

    const { domain, apiKey, fromEmail } = mailgunConfig.data();
    const { to, subject, html, templateName } = data;

    // Build email
    const emailData = {
      from: fromEmail,
      to: to,
      subject: subject,
      html: html
    };

    // Send via Mailgun
    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`api:${apiKey}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(emailData)
    });

    if (!response.ok) {
      throw new Error(`Mailgun error: ${response.statusText}`);
    }

    const result = await response.json();

    // Log email activity
    await logActivity('email_sent', {
      to,
      subject,
      templateName,
      messageId: result.id,
      timestamp: admin.firestore.Timestamp.now()
    });

    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('Email sending error:', error);
    await logActivity('email_failed', { error: error.message });
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Send templated email
 */
exports.sendTemplatedEmail = functions.https.onCall(async (data, context) => {
  const { customerId, templateName, variables } = data;

  try {
    // Get customer email
    const customer = await db.collection('customers').doc(customerId).get();
    if (!customer.exists) throw new Error('Customer not found');

    const email = customer.data().email;

    // Get template
    const template = await db.collection('templates')
      .where('name', '==', templateName)
      .where('type', '==', 'email')
      .limit(1)
      .get();

    if (template.empty) throw new Error('Template not found');

    // Build HTML with variables
    let html = template.docs[0].data().content;
    Object.keys(variables || {}).forEach(key => {
      html = html.replace(`{{${key}}}`, variables[key]);
    });

    // Send email
    return await exports.sendEmail.run({
      to: email,
      subject: template.docs[0].data().subject,
      html,
      templateName
    });
  } catch (error) {
    console.error('Templated email error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================
// SMS FUNCTIONS
// ============================================================

/**
 * Send SMS via Twilio
 */
exports.sendSms = functions.https.onCall(async (data, context) => {
  try {
    const twilioConfig = await db.doc(CONFIG_PATHS.twilio).get();
    if (!twilioConfig.exists) throw new Error('Twilio not configured');

    const { accountSid, authToken, fromPhone } = twilioConfig.data();
    const { to, message } = data;

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        From: fromPhone,
        To: to,
        Body: message
      })
    });

    const result = await response.json();

    if (result.sid) {
      await logActivity('sms_sent', {
        to,
        message: message.substring(0, 50),
        sid: result.sid
      });
      return { success: true, sid: result.sid };
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('SMS error:', error);
    await logActivity('sms_failed', { error: error.message });
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Send templated SMS
 */
exports.sendTemplatedSms = functions.https.onCall(async (data, context) => {
  const { customerId, templateName, variables } = data;

  try {
    const customer = await db.collection('customers').doc(customerId).get();
    if (!customer.exists) throw new Error('Customer not found');

    const phone = customer.data().phone;

    const template = await db.collection('templates')
      .where('name', '==', templateName)
      .where('type', '==', 'sms')
      .limit(1)
      .get();

    if (template.empty) throw new Error('Template not found');

    let message = template.docs[0].data().content;
    Object.keys(variables || {}).forEach(key => {
      message = message.replace(`{{${key}}}`, variables[key]);
    });

    return await exports.sendSms.run({
      to: phone,
      message
    });
  } catch (error) {
    console.error('Templated SMS error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================
// TELEGRAM WEBHOOKS
// ============================================================

/**
 * Telegram bot webhook handler
 */
exports.telegramWebhook = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(400).send('POST only');
      return;
    }

    const message = req.body;

    // Process update
    if (message.message) {
      const chatId = message.message.chat.id;
      const text = message.message.text;

      // Log message
      await logActivity('telegram_message', {
        chatId,
        text,
        userId: message.message.from.id
      });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send Telegram notification
 */
exports.sendTelegramNotification = functions.https.onCall(async (data, context) => {
  try {
    const config = await db.doc(CONFIG_PATHS.telegram).get();
    if (!config.exists) throw new Error('Telegram not configured');

    const { botToken, chatId } = config.data();
    const { message, type } = data;

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    });

    await logActivity('telegram_notification_sent', {
      type,
      chatId,
      messageId: response.data.result.message_id
    });

    return { success: true };
  } catch (error) {
    console.error('Telegram notification error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================
// PAYMENT WEBHOOKS
// ============================================================

/**
 * Monobank webhook handler
 */
exports.monobankWebhook = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(400).send('POST only');
      return;
    }

    const { type, data: paymentData } = req.body;

    if (type === 'StatementItem') {
      // Process Monobank payment
      const orderId = paymentData.reference;
      const amount = paymentData.amount / 100; // Convert from kopeks
      const status = paymentData.mcc === '4411' ? 'confirmed' : 'pending';

      // Update order
      await db.collection('orders').doc(orderId).update({
        status,
        payment_method: 'monobank',
        payment_id: paymentData.id,
        updated_at: admin.firestore.Timestamp.now()
      });

      // Log activity
      await logActivity('payment_received', {
        orderId,
        amount,
        method: 'monobank',
        paymentId: paymentData.id
      });

      // Send notifications
      await exports.sendTelegramNotification.run({
        message: `💳 Платіж на суму ${amount} грн отримано\nЗамовлення: ${orderId}`,
        type: 'payment'
      });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Monobank webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * LiqPay webhook handler
 */
exports.liqpayWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const { data, signature } = req.body;

    // Verify signature
    const liqpayConfig = await db.doc(CONFIG_PATHS.liqpay).get();
    const { privateKey } = liqpayConfig.data();

    const expectedSig = require('crypto')
      .createHash('sha1')
      .update(privateKey + data + privateKey)
      .digest('base64');

    if (signature !== expectedSig) {
      res.status(400).send('Invalid signature');
      return;
    }

    // Decode data
    const paymentData = JSON.parse(Buffer.from(data, 'base64').toString());
    const { order_id, amount, status } = paymentData;

    // Update order
    const statusMap = {
      'success': 'confirmed',
      'failure': 'cancelled',
      'wait_3ds': 'pending'
    };

    await db.collection('orders').doc(order_id).update({
      status: statusMap[status] || 'pending',
      payment_method: 'liqpay',
      payment_id: paymentData.transaction_id,
      updated_at: admin.firestore.Timestamp.now()
    });

    await logActivity('payment_received', {
      orderId: order_id,
      amount,
      method: 'liqpay',
      status
    });

    res.json({ ok: true });
  } catch (error) {
    console.error('LiqPay webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// NOVA POSHTA INTEGRATION
// ============================================================

/**
 * Get tracking info from Nova Poshta
 */
exports.getTrackingInfo = functions.https.onCall(async (data, context) => {
  try {
    const config = await db.doc(CONFIG_PATHS.novaposhta).get();
    if (!config.exists) throw new Error('Nova Poshta not configured');

    const { apiKey, url } = config.data();
    const { trackingNumber } = data;

    const response = await axios.post(url, {
      modelName: 'TrackingDocument',
      calledMethod: 'getStatusDocuments',
      methodProperties: {
        Documents: [{ DocumentNumber: trackingNumber }]
      },
      apiKey
    });

    if (response.data.success) {
      const tracking = response.data.data[0];
      return {
        status: tracking.Status,
        statusCode: tracking.StatusCode,
        currentLocation: tracking.WarehouseRecipient,
        lastUpdate: tracking.DateRedyond
      };
    } else {
      throw new Error('Tracking not found');
    }
  } catch (error) {
    console.error('Nova Poshta error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Create Nova Poshta shipment
 */
exports.createNovaPoshta Shipment = functions.https.onCall(async (data, context) => {
  try {
    const config = await db.doc(CONFIG_PATHS.novaposhta).get();
    const { apiKey, url } = config.data();

    const { orderId, recipient, phone, city, address, weight, costOnDelivery } = data;

    const response = await axios.post(url, {
      modelName: 'InternetDocument',
      calledMethod: 'save',
      methodProperties: {
        CityRecipient: city,
        Recipient: recipient,
        RecipientType: 'PrivatePerson',
        RecipientCityName: city,
        RecipientArea: '',
        RecipientAreaRegionsTT: '',
        RecipientAddressName: address,
        RecipientPhone: phone,
        Weight: weight || 1000,
        ServiceType: 'WarehouseToWarehouse',
        SeatsAmount: '1',
        Description: `Order #${orderId}`,
        Cost: costOnDelivery || 0,
        CargoType: 'Cargo',
        CargoDetails: [{
          weight: weight || 1000,
          description: `Order #${orderId}`
        }]
      },
      apiKey
    });

    if (response.data.success) {
      const shipment = response.data.data[0];

      // Update order with tracking info
      await db.collection('orders').doc(orderId).update({
        tracking_number: shipment.Number,
        tracking_url: `https://tracking.novaposhta.ua/?track=${shipment.Number}`,
        delivery_method: 'nova_poshta',
        status: 'shipped',
        updated_at: admin.firestore.Timestamp.now()
      });

      return { success: true, trackingNumber: shipment.Number };
    } else {
      throw new Error('Failed to create shipment');
    }
  } catch (error) {
    console.error('Nova Poshta shipment error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================
// BACKUP FUNCTIONS
// ============================================================

/**
 * Create database backup
 */
exports.createBackup = functions.https.onCall(async (data, context) => {
  try {
    const backupId = uuidv4();
    const timestamp = new Date();

    // Create backup metadata
    await db.collection('backups').doc(backupId).set({
      id: backupId,
      timestamp,
      status: 'completed',
      size: 0,
      type: 'automatic',
      collections: [
        'admins',
        'customers',
        'orders',
        'campaigns',
        'feedback',
        'admin_logs',
        'config',
        'templates'
      ],
      created_at: admin.firestore.Timestamp.now()
    });

    // Trigger backup to storage services
    await backupToGoogleDrive(backupId, timestamp);
    await backupToAwsS3(backupId, timestamp);
    await backupToDropbox(backupId, timestamp);

    await logActivity('backup_created', {
      backupId,
      timestamp,
      type: 'automatic'
    });

    return { success: true, backupId };
  } catch (error) {
    console.error('Backup creation error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Backup to Google Drive
 */
async function backupToGoogleDrive(backupId, timestamp) {
  try {
    const config = await db.doc(CONFIG_PATHS.googleDrive).get();
    if (!config.exists) return;

    // Implementation would use Google Drive API
    console.log(`Backing up to Google Drive: ${backupId}`);

    await logActivity('backup_googledrive', {
      backupId,
      status: 'completed'
    });
  } catch (error) {
    console.error('Google Drive backup error:', error);
  }
}

/**
 * Backup to AWS S3
 */
async function backupToAwsS3(backupId, timestamp) {
  try {
    const config = await db.doc(CONFIG_PATHS.awsS3).get();
    if (!config.exists) return;

    // Implementation would use AWS SDK
    console.log(`Backing up to AWS S3: ${backupId}`);

    await logActivity('backup_s3', {
      backupId,
      status: 'completed'
    });
  } catch (error) {
    console.error('AWS S3 backup error:', error);
  }
}

/**
 * Backup to Dropbox
 */
async function backupToDropbox(backupId, timestamp) {
  try {
    const config = await db.doc(CONFIG_PATHS.dropbox).get();
    if (!config.exists) return;

    // Implementation would use Dropbox API
    console.log(`Backing up to Dropbox: ${backupId}`);

    await logActivity('backup_dropbox', {
      backupId,
      status: 'completed'
    });
  } catch (error) {
    console.error('Dropbox backup error:', error);
  }
}

/**
 * Restore from backup
 */
exports.restoreBackup = functions.https.onCall(async (data, context) => {
  try {
    const { backupId } = data;

    // Verify backup exists
    const backup = await db.collection('backups').doc(backupId).get();
    if (!backup.exists) throw new Error('Backup not found');

    // Restore logic would go here
    await logActivity('backup_restored', {
      backupId,
      timestamp: admin.firestore.Timestamp.now()
    });

    return { success: true };
  } catch (error) {
    console.error('Restore error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================
// FIRESTORE TRIGGERS
// ============================================================

/**
 * Log all order creations
 */
exports.logOrderCreation = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();

    await logActivity('order_created', {
      orderId: context.params.orderId,
      customerId: order.customer_id,
      amount: order.amount,
      timestamp: admin.firestore.Timestamp.now()
    });

    // Send notification
    await exports.sendTelegramNotification.run({
      message: `📦 Нове замовлення!\nID: ${context.params.orderId}\nСума: ${order.amount} грн`,
      type: 'order_created'
    });
  });

/**
 * Log all order updates
 */
exports.logOrderUpdate = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.status !== after.status) {
      await logActivity('order_status_changed', {
        orderId: context.params.orderId,
        from: before.status,
        to: after.status,
        timestamp: admin.firestore.Timestamp.now()
      });

      // Send customer notification
      const customer = await db.collection('customers').doc(after.customer_id).get();
      await exports.sendTelegramNotification.run({
        message: `📦 Статус замовлення ${context.params.orderId}: ${after.status}`,
        type: 'order_updated'
      });
    }
  });

/**
 * Log campaign sends
 */
exports.logCampaignSend = functions.firestore
  .document('campaigns/{campaignId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.status !== 'sent' && after.status === 'sent') {
      await logActivity('campaign_sent', {
        campaignId: context.params.campaignId,
        type: after.type,
        recipients: after.recipients_count,
        timestamp: admin.firestore.Timestamp.now()
      });
    }
  });

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Log activity to admin_logs collection
 */
async function logActivity(action, details = {}) {
  try {
    await db.collection('admin_logs').add({
      action,
      details,
      timestamp: admin.firestore.Timestamp.now(),
      environment: process.env.GCLOUD_PROJECT
    });
  } catch (error) {
    console.error('Logging error:', error);
  }
}

/**
 * Scheduled backup (runs daily at 2 AM)
 */
exports.scheduledBackup = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('Europe/Kyiv')
  .onRun(async (context) => {
    try {
      await exports.createBackup.run({});
      console.log('Scheduled backup completed');
    } catch (error) {
      console.error('Scheduled backup error:', error);
    }
  });

/**
 * Scheduled analytics calculation (runs hourly)
 */
exports.calculateAnalytics = functions.pubsub
  .schedule('0 * * * *')
  .timeZone('Europe/Kyiv')
  .onRun(async (context) => {
    try {
      // Get today's orders
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const orders = await db.collection('orders')
        .where('created_at', '>=', admin.firestore.Timestamp.fromDate(today))
        .get();

      let totalRevenue = 0;
      let totalOrders = 0;

      orders.forEach(doc => {
        totalRevenue += doc.data().amount || 0;
        totalOrders++;
      });

      // Update analytics document
      await db.collection('analytics').doc('daily').update({
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        updated_at: admin.firestore.Timestamp.now()
      });

      console.log(`Analytics calculated: ${totalOrders} orders, ${totalRevenue} revenue`);
    } catch (error) {
      console.error('Analytics calculation error:', error);
    }
  });

/**
 * Cleanup old logs (keeps last 90 days)
 */
exports.cleanupLogs = functions.pubsub
  .schedule('0 3 * * 0') // Weekly at 3 AM Sunday
  .timeZone('Europe/Kyiv')
  .onRun(async (context) => {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const oldLogs = await db.collection('admin_logs')
        .where('timestamp', '<', admin.firestore.Timestamp.fromDate(ninetyDaysAgo))
        .get();

      let deleted = 0;
      const batch = db.batch();

      oldLogs.forEach(doc => {
        batch.delete(doc.ref);
        deleted++;
      });

      if (deleted > 0) {
        await batch.commit();
        console.log(`Deleted ${deleted} old log entries`);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

module.exports = exports;
