import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ChatMessage, ChatRoom, UserProfile } from './api';

export interface OutboxMessage {
  id: number; // local id
  chatid: number;
  text?: string;
  photo?: string;
  position?: string;
  important?: boolean;
  createdAt: number;
}

interface MessageDB extends DBSchema {
  chats: {
    key: number;
    value: ChatRoom;
  };
  messages: {
    key: string; // `${chatid}_${msgId}`
    value: ChatMessage;
    indexes: { 'by-chat': number };
  };
  profiles: {
    key: string;
    value: UserProfile;
  };
  outbox: {
    key: number;
    value: OutboxMessage;
    indexes: { 'by-chat': number };
  };
}

let dbPromise: Promise<IDBPDatabase<MessageDB>> | null = null;

export function getDB() {
  if (typeof window === 'undefined') return null; // Only run on client
  if (!dbPromise) {
    dbPromise = openDB<MessageDB>('talks-app-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('chats')) {
          db.createObjectStore('chats', { keyPath: 'chatid' });
        }
        if (!db.objectStoreNames.contains('messages')) {
          const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
          msgStore.createIndex('by-chat', 'chatid');
        }
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'hash' });
        }
        if (!db.objectStoreNames.contains('outbox')) {
          const outboxStore = db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
          outboxStore.createIndex('by-chat', 'chatid');
        }
      },
    });
  }
  return dbPromise;
}

// --- Data Operations ---

export async function saveChatsOffline(chats: ChatRoom[]) {
  const db = await getDB();
  if (!db) return;
  const tx = db.transaction('chats', 'readwrite');
  await Promise.all(chats.map(chat => tx.store.put(chat)));
  await tx.done;
}

export async function getChatsOffline(): Promise<ChatRoom[]> {
  const db = await getDB();
  if (!db) return [];
  return db.getAll('chats');
}

export async function saveMessagesOffline(chatid: number, messages: ChatMessage[]) {
  const db = await getDB();
  if (!db) return;
  const tx = db.transaction('messages', 'readwrite');
  // We can just put all messages. They have unique IDs.
  await Promise.all(messages.map(msg => tx.store.put(msg)));
  await tx.done;
}

export async function getMessagesOffline(chatid: number): Promise<ChatMessage[]> {
  const db = await getDB();
  if (!db) return [];
  const index = db.transaction('messages').store.index('by-chat');
  const messages = await index.getAll(chatid);
  // Sort by time
  return messages.sort((a, b) => {
     // simple string sort is usually fine for 'YYYY-MM-DD_HH-mm-ss' but just to be safe
     return a.time.localeCompare(b.time);
  });
}

export async function saveProfilesOffline(profiles: UserProfile[]) {
  const db = await getDB();
  if (!db) return;
  const tx = db.transaction('profiles', 'readwrite');
  await Promise.all(profiles.map(p => tx.store.put(p)));
  await tx.done;
}

export async function getProfilesOffline(): Promise<UserProfile[]> {
  const db = await getDB();
  if (!db) return [];
  return db.getAll('profiles');
}

// --- Outbox Operations ---

export async function addToOutbox(msg: Omit<OutboxMessage, 'id' | 'createdAt'>) {
  const db = await getDB();
  if (!db) return;
  await db.add('outbox', { ...msg, createdAt: Date.now() } as OutboxMessage); // id is auto-incremented
}

export async function getOutboxForChat(chatid: number): Promise<OutboxMessage[]> {
  const db = await getDB();
  if (!db) return [];
  const index = db.transaction('outbox').store.index('by-chat');
  return index.getAll(chatid);
}

export async function getAllOutboxMessages(): Promise<OutboxMessage[]> {
  const db = await getDB();
  if (!db) return [];
  return db.getAll('outbox');
}

export async function removeOutboxMessage(id: number) {
  const db = await getDB();
  if (!db) return;
  await db.delete('outbox', id);
}
