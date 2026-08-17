/**
 * SVAROG Firebase Initialization Script
 *
 * Sets up Firestore collections, indexes, security rules, and seed data
 * Run after creating Firebase project: node firebase-init.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
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
const auth = admin.auth();

// ============================================================
// INITIALIZATION FUNCTIONS
// ============================================================

/**
 * Create collections with initial documents
 */
async function initializeCollections() {
  console.log('📁 Initializing Firestore collections...');

  try {
    // 1. Create ROLES collection
    console.log('  → Creating roles...');
    const roles = {
      super_admin: {
        name: 'Super Admin',
        description: 'Full system access',
        permissions: {
          admins: { read: true, create: true, update: true, delete: true },
          roles: { read: true, create: true, update: true, delete: true },
          config: { read: true, create: true, update: true, delete: true },
          orders: { read: true, create: true, update: true, delete: true },
          customers: { read: true, create: true, update: true, delete: true },
          campaigns: { read: true, create: true, update: true, delete: true },
          templates: { read: true, create: true, update: true, delete: true },
          feedback: { read: true, create: true, update: true, delete: true },
          admin_logs: { read: true, create: false, update: false, delete: true },
          analytics: { read: true, create: false, update: false, delete: true },
          backups: { read: true, create: true, update: true, delete: true },
          settings: { read: true, create: true, update: true, delete: true }
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      moderator: {
        name: 'Moderator',
        description: 'Content and campaign management',
        permissions: {
          admins: { read: true, create: false, update: false, delete: false },
          roles: { read: true, create: false, update: false, delete: false },
          config: { read: false, create: false, update: false, delete: false },
          orders: { read: true, create: true, update: true, delete: false },
          customers: { read: true, create: true, update: true, delete: false },
          campaigns: { read: true, create: true, update: true, delete: false },
          templates: { read: true, create: true, update: true, delete: false },
          feedback: { read: true, create: false, update: true, delete: false },
          admin_logs: { read: true, create: false, update: false, delete: false },
          analytics: { read: true, create: false, update: false, delete: false },
          backups: { read: true, create: true, update: false, delete: false },
          settings: { read: true, create: false, update: false, delete: false }
        },
        created_at: new Date(),
        updated_at: new Date()
      },
      operator: {
        name: 'Operator',
        description: 'Basic order and customer management',
        permissions: {
          admins: { read: true, create: false, update: false, delete: false },
          roles: { read: true, create: false, update: false, delete: false },
          config: { read: false, create: false, update: false, delete: false },
          orders: { read: true, create: true, update: true, delete: false },
          customers: { read: true, create: true, update: true, delete: false },
          campaigns: { read: true, create: false, update: false, delete: false },
          templates: { read: true, create: false, update: false, delete: false },
          feedback: { read: true, create: false, update: false, delete: false },
          admin_logs: { read: false, create: false, update: false, delete: false },
          analytics: { read: true, create: false, update: false, delete: false },
          backups: { read: false, create: false, update: false, delete: false },
          settings: { read: true, create: false, update: false, delete: false }
        },
        created_at: new Date(),
        updated_at: new Date()
      }
    };

    for (const [roleId, roleData] of Object.entries(roles)) {
      await db.collection('roles').doc(roleId).set(roleData);
      console.log(`    ✓ Role "${roleId}" created`);
    }

    // 2. Create CONFIG collection with placeholders
    console.log('  → Creating config sections...');
    const configSections = {
      telegram: {
        botToken: '',
        chatId: '',
        webhookUrl: '',
        webhookSecret: '',
        enabled: false,
        updated_at: new Date()
      },
      monobank: {
        apiKey: '',
        xToken: '',
        webhookUrl: '',
        webhookSecret: '',
        enabled: false,
        updated_at: new Date()
      },
      liqpay: {
        merchantId: '',
        publicKey: '',
        privateKey: '',
        webhookUrl: '',
        enabled: false,
        updated_at: new Date()
      },
      mailgun: {
        domain: '',
        apiKey: '',
        fromEmail: '',
        fromName: 'SVAROG',
        enabled: false,
        updated_at: new Date()
      },
      twilio: {
        accountSid: '',
        authToken: '',
        phoneNumber: '',
        enabled: false,
        updated_at: new Date()
      },
      novaPoshta: {
        apiKey: '',
        apiUrl: 'https://api.novaposhta.ua/v2.0/json/',
        enabled: false,
        updated_at: new Date()
      },
      googleDrive: {
        folderId: '',
        apiKey: '',
        enabled: false,
        updated_at: new Date()
      },
      awsS3: {
        bucket: '',
        region: '',
        enabled: false,
        updated_at: new Date()
      },
      dropbox: {
        accessToken: '',
        folderPath: '/svarog-backups',
        enabled: false,
        updated_at: new Date()
      }
    };

    for (const [section, data] of Object.entries(configSections)) {
      await db.collection('config').doc(section).set(data);
      console.log(`    ✓ Config section "${section}" created`);
    }

    // 3. Create empty collections (just document structure)
    console.log('  → Creating collections...');
    const collections = ['orders', 'customers', 'campaigns', 'templates', 'feedback', 'admin_logs', 'chats', 'notifications', 'analytics', 'media'];

    for (const collection of collections) {
      // Create a placeholder document then delete it to create empty collection
      const docRef = db.collection(collection).doc('_placeholder_');
      await docRef.set({ placeholder: true, created_at: new Date() });
      await docRef.delete();
      console.log(`    ✓ Collection "${collection}" initialized`);
    }

    console.log('✅ Collections initialized successfully!\n');

  } catch (error) {
    console.error('❌ Error initializing collections:', error);
    throw error;
  }
}

/**
 * Create indexes for optimal query performance
 */
async function createIndexes() {
  console.log('🔍 Creating Firestore indexes...');

  try {
    // Note: Firestore composite indexes are created through Firebase Console or gcloud CLI
    // This function logs recommended indexes

    const recommendedIndexes = [
      {
        collection: 'orders',
        fields: [
          { fieldPath: 'status', order: 'ASCENDING' },
          { fieldPath: 'created_at', order: 'DESCENDING' }
        ]
      },
      {
        collection: 'orders',
        fields: [
          { fieldPath: 'customer_id', order: 'ASCENDING' },
          { fieldPath: 'created_at', order: 'DESCENDING' }
        ]
      },
      {
        collection: 'customers',
        fields: [
          { fieldPath: 'tier', order: 'ASCENDING' },
          { fieldPath: 'created_at', order: 'DESCENDING' }
        ]
      },
      {
        collection: 'campaigns',
        fields: [
          { fieldPath: 'status', order: 'ASCENDING' },
          { fieldPath: 'type', order: 'ASCENDING' }
        ]
      },
      {
        collection: 'chats',
        fields: [
          { fieldPath: 'participants', order: 'ASCENDING' },
          { fieldPath: 'updated_at', order: 'DESCENDING' }
        ]
      },
      {
        collection: 'admin_logs',
        fields: [
          { fieldPath: 'admin_id', order: 'ASCENDING' },
          { fieldPath: 'created_at', order: 'DESCENDING' }
        ]
      }
    ];

    console.log('\n  📋 Recommended indexes to create in Firebase Console:\n');
    recommendedIndexes.forEach((index, idx) => {
      console.log(`  ${idx + 1}. Collection: "${index.collection}"`);
      index.fields.forEach(field => {
        console.log(`     - ${field.fieldPath} (${field.order})`);
      });
      console.log('');
    });

    console.log('  💡 To create indexes automatically, run:');
    console.log('     firebase firestore:indexes');
    console.log('\n');

  } catch (error) {
    console.error('❌ Error with indexes:', error);
  }
}

/**
 * Deploy Firestore security rules
 */
async function deploySecurityRules() {
  console.log('🔐 Firestore Security Rules...\n');

  try {
    const rulesPath = './firestore.rules';

    if (fs.existsSync(rulesPath)) {
      console.log('  ✓ firestore.rules file found at:', rulesPath);
      console.log('\n  To deploy these rules, run:');
      console.log('     firebase deploy --only firestore:rules\n');
    } else {
      console.log('  ⚠️  firestore.rules file not found');
      console.log('  Create firestore.rules in project root first\n');
    }

  } catch (error) {
    console.error('❌ Error with security rules:', error);
  }
}

/**
 * Create initial super admin account
 */
async function createSuperAdmin() {
  console.log('👤 Creating Super Admin account...');

  try {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@svarog.app';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe@123456';

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email: superAdminEmail,
      password: superAdminPassword,
      displayName: 'Super Administrator'
    });

    console.log(`  → Firebase Auth user created: ${userRecord.uid}`);

    // Create admin document in Firestore
    await db.collection('admins').doc(userRecord.uid).set({
      email: superAdminEmail,
      name: 'Super Administrator',
      role: 'super_admin',
      permissions: {
        admins: { read: true, create: true, update: true, delete: true },
        config: { read: true, create: true, update: true, delete: true },
        orders: { read: true, create: true, update: true, delete: true },
        customers: { read: true, create: true, update: true, delete: true },
        campaigns: { read: true, create: true, update: true, delete: true },
        feedback: { read: true, create: true, update: true, delete: true },
        analytics: { read: true, create: true, update: true, delete: true },
        backups: { read: true, create: true, update: true, delete: true }
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    });

    console.log(`  ✓ Admin document created\n`);

    console.log('  📧 Super Admin Credentials:');
    console.log(`     Email: ${superAdminEmail}`);
    console.log(`     Password: ${superAdminPassword}`);
    console.log('\n  ⚠️  Change password immediately after first login!\n');

  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('  ⚠️  Super admin already exists\n');
    } else {
      console.error('❌ Error creating super admin:', error);
      throw error;
    }
  }
}

/**
 * Create sample data (optional)
 */
async function createSampleData() {
  console.log('📊 Creating sample data...');

  try {
    // Sample customer
    const customer = {
      name: 'Sample Customer',
      email: 'customer@example.com',
      phone: '+380123456789',
      city: 'Kyiv',
      address: 'Sample Street 1',
      tier: 'regular',
      total_spent: 0,
      orders_count: 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    const customerRef = await db.collection('customers').add(customer);
    console.log(`  ✓ Sample customer created: ${customerRef.id}`);

    // Sample order
    const order = {
      customer_id: customerRef.id,
      order_date: new Date(),
      status: 'pending',
      items: [
        {
          name: 'Sample Item',
          price: 100,
          quantity: 1,
          total: 100
        }
      ],
      total: 100,
      payment_method: 'cash',
      delivery_method: 'pickup',
      notes: 'Sample order for testing',
      created_at: new Date(),
      updated_at: new Date()
    };

    const orderRef = await db.collection('orders').add(order);
    console.log(`  ✓ Sample order created: ${orderRef.id}`);

    // Sample email template
    const emailTemplate = {
      name: 'Order Confirmation',
      type: 'email',
      subject: 'Order #{order_id} Confirmed',
      body: `
Dear {customer_name},

Thank you for your order #{order_id}.

Total: {total_amount}
Status: {order_status}

Best regards,
SVAROG Team
      `.trim(),
      variables: ['order_id', 'customer_name', 'total_amount', 'order_status'],
      created_at: new Date(),
      updated_at: new Date()
    };

    const templateRef = await db.collection('templates').add(emailTemplate);
    console.log(`  ✓ Sample email template created: ${templateRef.id}`);

    console.log('✅ Sample data created successfully!\n');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
}

/**
 * Display setup summary
 */
function displaySummary() {
  console.log('\n' + '='.repeat(60));
  console.log('✅ SVAROG Firebase Initialization Complete!');
  console.log('='.repeat(60) + '\n');

  console.log('📋 Next Steps:\n');
  console.log('1. Deploy Firestore Security Rules:');
  console.log('   firebase deploy --only firestore:rules\n');

  console.log('2. Create Firestore Indexes (optional but recommended):');
  console.log('   firebase firestore:indexes\n');

  console.log('3. Deploy Cloud Functions:');
  console.log('   cd functions && firebase deploy --only functions\n');

  console.log('4. Configure environment variables in Firebase Console:');
  console.log('   Settings → Project settings → Environment variables\n');

  console.log('5. Test the connection:');
  console.log('   npm start\n');

  console.log('📚 Documentation:');
  console.log('   - Firebase Console: https://console.firebase.google.com');
  console.log('   - Firestore: https://firebase.google.com/docs/firestore');
  console.log('   - Cloud Functions: https://firebase.google.com/docs/functions\n');
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 SVAROG Firebase Initialization Script v3.1.0');
  console.log('='.repeat(60) + '\n');

  try {
    // Run initialization steps
    await initializeCollections();
    await createIndexes();
    await deploySecurityRules();
    await createSuperAdmin();

    // Optional: Create sample data
    const args = process.argv.slice(2);
    if (args.includes('--sample')) {
      await createSampleData();
    }

    displaySummary();

    // Close connection
    await admin.app().delete();

  } catch (error) {
    console.error('\n❌ Initialization failed:', error.message);
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
