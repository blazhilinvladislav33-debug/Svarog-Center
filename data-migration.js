/**
 * SVAROG Data Migration Script
 *
 * Imports data from old systems to Firebase Firestore
 * Supports: CSV, JSON, MongoDB exports
 *
 * Usage:
 *   node data-migration.js --type customers --file customers.csv
 *   node data-migration.js --type orders --file orders.json
 *   node data-migration.js --type photos --file photos.json
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config();

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

const db = admin.firestore();

// ============================================================
// DATA VALIDATION FUNCTIONS
// ============================================================

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  const phoneRegex = /^[+]?[0-9]{10,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
}

function normalizePhone(phone) {
  return phone.replace(/[\s\-()]/g, '');
}

// ============================================================
// CSV PARSER
// ============================================================

async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity
    });

    let headers = [];
    let lineNumber = 0;

    rl.on('line', (line) => {
      lineNumber++;
      const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));

      if (lineNumber === 1) {
        headers = values;
      } else {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        rows.push(row);
      }
    });

    rl.on('close', () => {
      resolve(rows);
    });

    rl.on('error', reject);
  });
}

// ============================================================
// JSON PARSER
// ============================================================

function parseJSON(filePath) {
  const rawData = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(rawData);
}

// ============================================================
// MIGRATORS
// ============================================================

/**
 * Migrate customers
 */
async function migrateCustomers(data) {
  console.log(`\n📥 Migrating ${data.length} customers...\n`);

  let successful = 0;
  let failed = 0;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    try {
      // Validate required fields
      if (!item.email || !validateEmail(item.email)) {
        console.log(`  ⚠️  Row ${i + 1}: Invalid email "${item.email}" - skipped`);
        failed++;
        continue;
      }

      // Prepare document
      const customer = {
        name: item.name || item.customer_name || 'Unknown',
        email: item.email.toLowerCase(),
        phone: item.phone ? normalizePhone(item.phone) : '',
        city: item.city || item.location || '',
        address: item.address || '',
        tier: item.tier || 'regular',
        total_spent: parseFloat(item.total_spent) || 0,
        orders_count: parseInt(item.orders_count) || 0,
        notes: item.notes || '',
        created_at: item.created_at ? new Date(item.created_at) : new Date(),
        updated_at: new Date(),
        migrated: true
      };

      // Validate phone if present
      if (customer.phone && !validatePhone(customer.phone)) {
        console.log(`  ⚠️  Row ${i + 1}: Invalid phone "${item.phone}" - saved without phone`);
        customer.phone = '';
      }

      // Add to Firestore
      await db.collection('customers').add(customer);

      successful++;
      if ((i + 1) % 10 === 0) {
        console.log(`  ✓ ${i + 1}/${data.length} customers processed...`);
      }

    } catch (error) {
      console.log(`  ❌ Row ${i + 1}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n✅ Customers migration complete:`);
  console.log(`   ✓ Successful: ${successful}`);
  console.log(`   ✗ Failed: ${failed}\n`);

  return { successful, failed };
}

/**
 * Migrate orders
 */
async function migrateOrders(data) {
  console.log(`\n📥 Migrating ${data.length} orders...\n`);

  let successful = 0;
  let failed = 0;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    try {
      // Validate required fields
      if (!item.customer_id && !item.customer_email) {
        console.log(`  ⚠️  Row ${i + 1}: No customer reference - skipped`);
        failed++;
        continue;
      }

      // Find customer ID
      let customerId = item.customer_id;
      if (!customerId && item.customer_email) {
        const snapshot = await db.collection('customers')
          .where('email', '==', item.customer_email.toLowerCase())
          .limit(1)
          .get();

        if (snapshot.empty) {
          console.log(`  ⚠️  Row ${i + 1}: Customer "${item.customer_email}" not found - skipped`);
          failed++;
          continue;
        }

        customerId = snapshot.docs[0].id;
      }

      // Parse items
      let items = [];
      if (typeof item.items === 'string') {
        items = JSON.parse(item.items);
      } else if (Array.isArray(item.items)) {
        items = item.items;
      }

      // Prepare document
      const order = {
        customer_id: customerId,
        order_date: item.order_date ? new Date(item.order_date) : new Date(),
        status: item.status || 'pending',
        items: items,
        total: parseFloat(item.total) || 0,
        payment_method: item.payment_method || 'cash',
        delivery_method: item.delivery_method || 'pickup',
        tracking_number: item.tracking_number || '',
        notes: item.notes || '',
        created_at: item.created_at ? new Date(item.created_at) : new Date(),
        updated_at: new Date(),
        migrated: true
      };

      // Add to Firestore
      await db.collection('orders').add(order);

      successful++;
      if ((i + 1) % 10 === 0) {
        console.log(`  ✓ ${i + 1}/${data.length} orders processed...`);
      }

    } catch (error) {
      console.log(`  ❌ Row ${i + 1}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n✅ Orders migration complete:`);
  console.log(`   ✓ Successful: ${successful}`);
  console.log(`   ✗ Failed: ${failed}\n`);

  return { successful, failed };
}

/**
 * Migrate photos/media
 */
async function migratePhotos(data) {
  console.log(`\n📥 Migrating ${data.length} photos...\n`);

  let successful = 0;
  let failed = 0;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    try {
      // Validate URL
      if (!item.url) {
        console.log(`  ⚠️  Row ${i + 1}: No URL provided - skipped`);
        failed++;
        continue;
      }

      // Determine where to store
      let collection = 'media';
      let docId = null;

      if (item.order_id) {
        collection = 'orders';
        docId = item.order_id;
      } else if (item.customer_id) {
        collection = 'customers';
        docId = item.customer_id;
      }

      // Prepare document
      const photo = {
        url: item.url,
        title: item.title || item.name || 'Photo',
        description: item.description || '',
        type: item.type || 'image',
        uploaded_by: item.uploaded_by || 'migration',
        size: item.size || 0,
        mime_type: item.mime_type || 'image/jpeg',
        created_at: item.created_at ? new Date(item.created_at) : new Date(),
        migrated: true
      };

      // Add to appropriate collection
      if (collection === 'media') {
        await db.collection('media').add(photo);
      } else if (docId) {
        // Add as subcollection
        await db.collection(collection).doc(docId).collection('photos').add(photo);
      }

      successful++;
      if ((i + 1) % 10 === 0) {
        console.log(`  ✓ ${i + 1}/${data.length} photos processed...`);
      }

    } catch (error) {
      console.log(`  ❌ Row ${i + 1}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n✅ Photos migration complete:`);
  console.log(`   ✓ Successful: ${successful}`);
  console.log(`   ✗ Failed: ${failed}\n`);

  return { successful, failed };
}

/**
 * Migrate chats
 */
async function migrateChats(data) {
  console.log(`\n📥 Migrating ${data.length} chats...\n`);

  let successful = 0;
  let failed = 0;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    try {
      // Validate participants
      let participants = [];
      if (typeof item.participants === 'string') {
        participants = item.participants.split(',').map(p => p.trim());
      } else if (Array.isArray(item.participants)) {
        participants = item.participants;
      }

      if (participants.length < 2) {
        console.log(`  ⚠️  Row ${i + 1}: Need at least 2 participants - skipped`);
        failed++;
        continue;
      }

      // Prepare document
      const chat = {
        participants: participants,
        subject: item.subject || 'Chat',
        created_at: item.created_at ? new Date(item.created_at) : new Date(),
        updated_at: new Date(),
        migrated: true
      };

      // Add to Firestore
      const chatRef = await db.collection('chats').add(chat);

      // Add messages if provided
      if (item.messages && typeof item.messages === 'string') {
        const messages = JSON.parse(item.messages);
        for (const msg of messages) {
          await chatRef.collection('messages').add({
            sender_id: msg.sender_id,
            text: msg.text || msg.message || '',
            created_at: msg.created_at ? new Date(msg.created_at) : new Date(),
            migrated: true
          });
        }
      }

      successful++;
      if ((i + 1) % 10 === 0) {
        console.log(`  ✓ ${i + 1}/${data.length} chats processed...`);
      }

    } catch (error) {
      console.log(`  ❌ Row ${i + 1}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n✅ Chats migration complete:`);
  console.log(`   ✓ Successful: ${successful}`);
  console.log(`   ✗ Failed: ${failed}\n`);

  return { successful, failed };
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 SVAROG Data Migration Tool v3.1.0');
  console.log('='.repeat(60));

  try {
    // Parse arguments
    const args = process.argv.slice(2);
    const typeArg = args.find(a => a.startsWith('--type'));
    const fileArg = args.find(a => a.startsWith('--file'));

    if (!typeArg || !fileArg) {
      console.log('\n❌ Usage: node data-migration.js --type <type> --file <file>\n');
      console.log('Supported types: customers, orders, photos, chats\n');
      console.log('Examples:');
      console.log('  node data-migration.js --type customers --file customers.csv');
      console.log('  node data-migration.js --type orders --file orders.json');
      console.log('  node data-migration.js --type photos --file photos.json\n');
      process.exit(1);
    }

    const type = typeArg.split('=')[1];
    const filePath = fileArg.split('=')[1];

    if (!fs.existsSync(filePath)) {
      console.log(`\n❌ File not found: ${filePath}\n`);
      process.exit(1);
    }

    console.log(`\n🔄 Preparing to migrate: ${type}`);
    console.log(`📄 File: ${filePath}\n`);

    // Parse data
    let data;
    if (filePath.endsWith('.csv')) {
      data = await parseCSV(filePath);
    } else if (filePath.endsWith('.json')) {
      data = parseJSON(filePath);
    } else {
      console.log('❌ Unsupported file format. Use .csv or .json\n');
      process.exit(1);
    }

    console.log(`Found ${data.length} records to import`);

    // Migrate based on type
    let result;
    switch (type.toLowerCase()) {
      case 'customers':
        result = await migrateCustomers(data);
        break;
      case 'orders':
        result = await migrateOrders(data);
        break;
      case 'photos':
      case 'media':
        result = await migratePhotos(data);
        break;
      case 'chats':
        result = await migrateChats(data);
        break;
      default:
        console.log(`\n❌ Unknown type: ${type}\n`);
        process.exit(1);
    }

    // Summary
    console.log('='.repeat(60));
    console.log(`\n✅ Migration complete!`);
    if (result.failed > 0) {
      console.log(`\n⚠️  ${result.failed} record(s) failed to import.`);
      console.log('Check the logs above for details.\n');
    } else {
      console.log(`\n🎉 All records migrated successfully!\n`);
    }

    // Close connection
    await admin.app().delete();

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run main
main().then(() => {
  console.log('👋 Done!\n');
  process.exit(0);
}).catch(error => {
  console.error(error);
  process.exit(1);
});
