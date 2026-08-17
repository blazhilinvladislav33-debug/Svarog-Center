/**
 * SVAROG Command Center v3.1.0
 * Firebase Configuration & Initialization
 */

// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js';
import { getFirestore, collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc, addDoc, orderBy, onSnapshot, writeBatch } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-functions.js';

// Firebase Configuration
// Replace with your actual Firebase project config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app, 'europe-west1'); // Set region

// Set up function timeouts (default is 60 seconds)
functions.region('europe-west1').httpsCallable('sendEmail');

// ============================================================
// AUTHENTICATION HELPERS
// ============================================================

/**
 * Login user
 */
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user role and permissions
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    if (!adminDoc.exists()) {
      throw new Error('Admin account not found');
    }

    const adminData = adminDoc.data();
    return {
      uid: user.uid,
      email: user.email,
      name: adminData.name,
      role: adminData.role,
      permissions: adminData.permissions || {}
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Logout user
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

/**
 * Get current user
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return auth.currentUser !== null;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChanged(callback) {
  return auth.onAuthStateChanged(callback);
}

// ============================================================
// FIRESTORE HELPERS
// ============================================================

/**
 * Get all documents from collection
 */
export async function getCollectionData(collectionName, constraints = []) {
  try {
    const q = query(collection(db, collectionName), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Error getting ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Get single document
 */
export async function getDocument(collectionName, docId) {
  try {
    const docRef = doc(db, collectionName, docId);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error getting document:`, error);
    throw error;
  }
}

/**
 * Create document
 */
export async function createDocument(collectionName, data) {
  try {
    const docRef = doc(collection(db, collectionName));
    await setDoc(docRef, {
      ...data,
      created_at: new Date(),
      updated_at: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error creating document:`, error);
    throw error;
  }
}

/**
 * Update document
 */
export async function updateDocument(collectionName, docId, data) {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updated_at: new Date()
    });
    return true;
  } catch (error) {
    console.error(`Error updating document:`, error);
    throw error;
  }
}

/**
 * Delete document
 */
export async function deleteDocument(collectionName, docId) {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(`Error deleting document:`, error);
    throw error;
  }
}

// ============================================================
// CLOUD FUNCTIONS WRAPPERS
// ============================================================

/**
 * Send email
 */
export async function sendEmail(to, subject, html, templateName = '') {
  try {
    const sendEmailFn = httpsCallable(functions, 'sendEmail');
    const result = await sendEmailFn({ to, subject, html, templateName });
    return result.data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Send templated email
 */
export async function sendTemplatedEmail(customerId, templateName, variables) {
  try {
    const fn = httpsCallable(functions, 'sendTemplatedEmail');
    const result = await fn({ customerId, templateName, variables });
    return result.data;
  } catch (error) {
    console.error('Error sending templated email:', error);
    throw error;
  }
}

/**
 * Send SMS
 */
export async function sendSms(to, message) {
  try {
    const sendSmsFn = httpsCallable(functions, 'sendSms');
    const result = await sendSmsFn({ to, message });
    return result.data;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}

/**
 * Send templated SMS
 */
export async function sendTemplatedSms(customerId, templateName, variables) {
  try {
    const fn = httpsCallable(functions, 'sendTemplatedSms');
    const result = await fn({ customerId, templateName, variables });
    return result.data;
  } catch (error) {
    console.error('Error sending templated SMS:', error);
    throw error;
  }
}

/**
 * Get Nova Poshta tracking info
 */
export async function getTrackingInfo(trackingNumber) {
  try {
    const fn = httpsCallable(functions, 'getTrackingInfo');
    const result = await fn({ trackingNumber });
    return result.data;
  } catch (error) {
    console.error('Error getting tracking info:', error);
    throw error;
  }
}

/**
 * Create Nova Poshta shipment
 */
export async function createNovaPoshtaShipment(orderId, recipient, phone, city, address, weight, costOnDelivery) {
  try {
    const fn = httpsCallable(functions, 'createNovaPoeshtaShipment');
    const result = await fn({
      orderId,
      recipient,
      phone,
      city,
      address,
      weight,
      costOnDelivery
    });
    return result.data;
  } catch (error) {
    console.error('Error creating Nova Poshta shipment:', error);
    throw error;
  }
}

/**
 * Send Telegram notification
 */
export async function sendTelegramNotification(message, type = 'info') {
  try {
    const fn = httpsCallable(functions, 'sendTelegramNotification');
    const result = await fn({ message, type });
    return result.data;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    throw error;
  }
}

/**
 * Create backup
 */
export async function createBackup() {
  try {
    const fn = httpsCallable(functions, 'createBackup');
    const result = await fn({});
    return result.data;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
}

/**
 * Restore from backup
 */
export async function restoreBackup(backupId) {
  try {
    const fn = httpsCallable(functions, 'restoreBackup');
    const result = await fn({ backupId });
    return result.data;
  } catch (error) {
    console.error('Error restoring backup:', error);
    throw error;
  }
}

// ============================================================
// CHAT FUNCTIONS
// ============================================================

/**
 * Create a new chat
 */
export async function createChat(participants, subject = '') {
  try {
    const chatRef = await addDoc(collection(db, 'chats'), {
      participants: participants,
      subject: subject,
      created_at: new Date(),
      updated_at: new Date()
    });
    return chatRef.id;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
}

/**
 * Get user's chats
 */
export async function getUserChats(userId) {
  try {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting chats:', error);
    throw error;
  }
}

/**
 * Get chat messages
 */
export async function getChatMessages(chatId) {
  try {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('created_at', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
}

/**
 * Send chat message
 */
export async function sendMessage(chatId, senderId, text) {
  try {
    const messageRef = await addDoc(
      collection(db, 'chats', chatId, 'messages'),
      {
        sender_id: senderId,
        text: text,
        created_at: new Date()
      }
    );

    // Update chat updated_at timestamp
    await updateDoc(doc(db, 'chats', chatId), {
      updated_at: new Date()
    });

    return messageRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Listen to chat messages in real-time
 */
export function listenToChatMessages(chatId, callback) {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('created_at', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(messages);
  });
}

/**
 * Delete chat message
 */
export async function deleteMessage(chatId, messageId) {
  try {
    await deleteDoc(doc(db, 'chats', chatId, 'messages', messageId));
    return true;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
}

// ============================================================
// MEDIA/PHOTO FUNCTIONS
// ============================================================

/**
 * Upload media file
 */
export async function uploadMedia(file, uploadedBy, mediaType = 'image') {
  try {
    const storageRef = ref(storage, `media/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    // Save media metadata to Firestore
    const mediaRef = await addDoc(collection(db, 'media'), {
      url: url,
      title: file.name,
      type: mediaType,
      size: file.size,
      mime_type: file.type,
      uploaded_by: uploadedBy,
      created_at: new Date()
    });

    return {
      id: mediaRef.id,
      url: url,
      name: file.name
    };
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
}

/**
 * Add photo to order
 */
export async function addOrderPhoto(orderId, photoUrl, title = '') {
  try {
    const photoRef = await addDoc(
      collection(db, 'orders', orderId, 'photos'),
      {
        url: photoUrl,
        title: title,
        created_at: new Date()
      }
    );
    return photoRef.id;
  } catch (error) {
    console.error('Error adding order photo:', error);
    throw error;
  }
}

/**
 * Get order photos
 */
export async function getOrderPhotos(orderId) {
  try {
    const snapshot = await getDocs(collection(db, 'orders', orderId, 'photos'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting order photos:', error);
    throw error;
  }
}

/**
 * Add photo to customer
 */
export async function addCustomerPhoto(customerId, photoUrl, title = '') {
  try {
    const photoRef = await addDoc(
      collection(db, 'customers', customerId, 'photos'),
      {
        url: photoUrl,
        title: title,
        created_at: new Date()
      }
    );
    return photoRef.id;
  } catch (error) {
    console.error('Error adding customer photo:', error);
    throw error;
  }
}

/**
 * Get customer photos
 */
export async function getCustomerPhotos(customerId) {
  try {
    const snapshot = await getDocs(collection(db, 'customers', customerId, 'photos'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting customer photos:', error);
    throw error;
  }
}

// ============================================================
// REALTIME LISTENERS
// ============================================================

/**
 * Listen to collection changes
 */
export function listenToCollection(collectionName, callback, constraints = []) {
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
}

/**
 * Listen to document changes
 */
export function listenToDocument(collectionName, docId, callback) {
  const docRef = doc(db, collectionName, docId);
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() });
    }
  });
}

// ============================================================
// BATCH OPERATIONS
// ============================================================

/**
 * Batch update multiple documents
 */
export async function batchUpdateDocuments(collectionName, updates) {
  try {
    const batch = writeBatch(db);

    for (const [docId, data] of Object.entries(updates)) {
      const docRef = doc(db, collectionName, docId);
      batch.update(docRef, { ...data, updated_at: new Date() });
    }

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error in batch update:', error);
    throw error;
  }
}

/**
 * Batch delete documents
 */
export async function batchDeleteDocuments(collectionName, docIds) {
  try {
    const batch = writeBatch(db);

    for (const docId of docIds) {
      const docRef = doc(db, collectionName, docId);
      batch.delete(docRef);
    }

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error in batch delete:', error);
    throw error;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export { auth, db, storage, functions };

export default {
  // Auth
  loginUser,
  logoutUser,
  getCurrentUser,
  isAuthenticated,
  onAuthStateChanged,

  // Firestore
  getCollectionData,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  listenToCollection,
  listenToDocument,

  // Cloud Functions
  sendEmail,
  sendTemplatedEmail,
  sendSms,
  sendTemplatedSms,
  getTrackingInfo,
  createNovaPoshtaShipment,
  sendTelegramNotification,
  createBackup,
  restoreBackup,

  // Chat Functions
  createChat,
  getUserChats,
  getChatMessages,
  sendMessage,
  listenToChatMessages,
  deleteMessage,

  // Media/Photo Functions
  uploadMedia,
  addOrderPhoto,
  getOrderPhotos,
  addCustomerPhoto,
  getCustomerPhotos,

  // Batch
  batchUpdateDocuments,
  batchDeleteDocuments,

  // Services
  auth,
  db,
  storage,
  functions
};
