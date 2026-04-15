/**
 * firebase.js
 * 
 * Drop-in Firebase SDK helpers that mirror your original SQL schema:
 *   profiles · items · savedItems · chats · messages
 * 
 * Firestore collections:
 *   /profiles/{profileId}
 *   /items/{itemId}
 *   /savedItems/{savedItemId}
 *   /chats/{chatId}
 *   /chats/{chatId}/messages/{messageId}   ← messages are a subcollection
 *
 * Real-time (replaces ALTER PUBLICATION supabase_realtime ADD TABLE messages):
 *   Use onSnapshot() — all listeners below are real-time by default.
 */

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig"; // your initialized Firestore instance

// ─────────────────────────────────────────────────────────────
// PROFILES
// ─────────────────────────────────────────────────────────────

/**
 * Create a profile document (call after Firebase Auth sign-up).
 * Mirrors: INSERT INTO profiles (user_id, username, email, ...)
 */
export async function createProfile({ userId, username, email, location, avatarUrl }) {
  const profileRef = doc(collection(db, "profiles"));
  await setDoc(profileRef, {
    userId,
    username,
    email,
    location: location ?? null,
    avatarUrl: avatarUrl ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return profileRef.id;
}

/**
 * Get a single profile by its Firestore document ID.
 * Mirrors: SELECT * FROM profiles WHERE id = ?
 */
export async function getProfile(profileId) {
  const snap = await getDoc(doc(db, "profiles", profileId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Get a profile by userId (auth UID).
 * Mirrors: SELECT * FROM profiles WHERE user_id = ?
 */
export async function getProfileByUserId(userId) {
  const q = query(collection(db, "profiles"), where("userId", "==", userId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

/**
 * Update the current user's profile.
 * Mirrors: UPDATE profiles SET ... WHERE user_id = auth.uid()
 */
export async function updateProfile(profileId, updates) {
  await updateDoc(doc(db, "profiles", profileId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// ─────────────────────────────────────────────────────────────
// ITEMS
// ─────────────────────────────────────────────────────────────

/**
 * Create a new listing.
 * Mirrors: INSERT INTO items (seller_id, name, price, ...)
 */
export async function createItem({ sellerId, name, price, description, category, colour, material, size, additionalInfo, photos }) {
  const ref = await addDoc(collection(db, "items"), {
    sellerId,
    name,
    price,
    description: description ?? null,
    category,
    colour: colour ?? null,
    material: material ?? null,
    size: size ?? null,
    additionalInfo: additionalInfo ?? null,
    photos: photos ?? [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Get all items (public feed).
 * Mirrors: SELECT * FROM items
 */
export async function getAllItems() {
  const snap = await getDocs(query(collection(db, "items"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Get items listed by a specific seller.
 * Mirrors: SELECT * FROM items WHERE seller_id = ?
 */
export async function getItemsBySeller(sellerId) {
  // Note: combining where() + orderBy() on different fields requires a composite
  // index. We sort client-side here to avoid that requirement.
  const q = query(collection(db, "items"), where("sellerId", "==", sellerId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.());
}

/**
 * Update an item (seller only — enforced by Firestore rules).
 * Mirrors: UPDATE items SET ... WHERE id = ? AND seller_id = auth.uid()
 */
export async function updateItem(itemId, updates) {
  await updateDoc(doc(db, "items", itemId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete an item (seller only — enforced by Firestore rules).
 * Mirrors: DELETE FROM items WHERE id = ? AND seller_id = auth.uid()
 */
export async function deleteItem(itemId) {
  await deleteDoc(doc(db, "items", itemId));
}

// ─────────────────────────────────────────────────────────────
// SAVED ITEMS
// ─────────────────────────────────────────────────────────────

/**
 * Save an item for the current user.
 * Mirrors: INSERT INTO saved_items (user_id, item_id)
 * Uses a deterministic ID to enforce the UNIQUE(user_id, item_id) constraint.
 */
export async function saveItem(userId, itemId) {
  const savedRef = doc(db, "savedItems", `${userId}_${itemId}`);
  await setDoc(savedRef, {
    userId,
    itemId,
    createdAt: serverTimestamp(),
  });
}

/**
 * Unsave an item.
 * Mirrors: DELETE FROM saved_items WHERE user_id = auth.uid() AND item_id = ?
 */
export async function unsaveItem(userId, itemId) {
  await deleteDoc(doc(db, "savedItems", `${userId}_${itemId}`));
}

/**
 * Get all saved items for a user.
 * Mirrors: SELECT * FROM saved_items WHERE user_id = auth.uid()
 */
export async function getSavedItems(userId) {
  // Sort client-side to avoid requiring a composite index on (userId, createdAt).
  const q = query(collection(db, "savedItems"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.());
}

// ─────────────────────────────────────────────────────────────
// CHATS
// ─────────────────────────────────────────────────────────────

/**
 * Create or retrieve a chat between a buyer and seller for an item.
 * Mirrors: INSERT INTO chats (item_id, buyer_id, seller_id) with UNIQUE constraint.
 * Uses a deterministic ID to avoid duplicate chats.
 */
export async function getOrCreateChat(itemId, buyerId, sellerId) {
  const chatId = `${itemId}_${buyerId}_${sellerId}`;
  const chatRef = doc(db, "chats", chatId);
  const snap = await getDoc(chatRef);
  if (!snap.exists()) {
    await setDoc(chatRef, {
      itemId,
      buyerId,
      sellerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  return chatId;
}

/**
 * Get all chats for the current user (as buyer or seller).
 * Mirrors: SELECT * FROM chats WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
 * Note: Firestore requires two separate queries (no OR across different fields).
 */
export async function getUserChats(userId) {
  const [buyerSnap, sellerSnap] = await Promise.all([
    getDocs(query(collection(db, "chats"), where("buyerId", "==", userId))),
    getDocs(query(collection(db, "chats"), where("sellerId", "==", userId))),
  ]);
  const seen = new Set();
  const chats = [];
  for (const d of [...buyerSnap.docs, ...sellerSnap.docs]) {
    if (!seen.has(d.id)) {
      seen.add(d.id);
      chats.push({ id: d.id, ...d.data() });
    }
  }
  return chats;
}

// ─────────────────────────────────────────────────────────────
// MESSAGES  (subcollection of chats — real-time by default)
// ─────────────────────────────────────────────────────────────

/**
 * Send a message in a chat.
 * Mirrors: INSERT INTO messages (chat_id, sender_id, content)
 * Also bumps the parent chat's updatedAt (mirrors the trigger behaviour).
 */
export async function sendMessage(chatId, senderId, content) {
  const messagesRef = collection(db, "chats", chatId, "messages");
  const msgRef = await addDoc(messagesRef, {
    chatId,
    senderId,
    content,
    createdAt: serverTimestamp(),
  });
  // Mirror the update_chats_updated_at trigger
  await updateDoc(doc(db, "chats", chatId), { updatedAt: serverTimestamp() });
  return msgRef.id;
}

/**
 * Subscribe to real-time messages in a chat.
 * Mirrors: ALTER PUBLICATION supabase_realtime ADD TABLE messages
 *
 * @param {string} chatId
 * @param {(messages: object[]) => void} callback
 * @returns {() => void} unsubscribe function
 */
export function subscribeToMessages(chatId, callback) {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(messages);
  });
}

/**
 * Fetch messages once (non-real-time).
 * Mirrors: SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC
 */
export async function getMessages(chatId) {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
