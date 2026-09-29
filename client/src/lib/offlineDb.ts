/**
 * Offline Database — IndexedDB Cache
 * 
 * Uses the `idb` library for a promise-based IndexedDB wrapper.
 * Caches user profile, dashboard widgets, and attendance data
 * for offline access. Also provides a pending actions queue
 * for syncing mutations when connectivity is restored.
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface MechzieDB extends DBSchema {
  userData: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
    };
  };
  dashboardData: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
    };
  };
  apiCache: {
    key: string;
    value: {
      url: string;
      data: any;
      timestamp: number;
      ttl: number; // time to live in ms
    };
  };
  pendingActions: {
    key: number;
    value: {
      id?: number;
      method: string;
      url: string;
      data?: any;
      timestamp: number;
    };
    indexes: { 'by-timestamp': number };
  };
}

const DB_NAME = 'mechzie-offline';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<MechzieDB> | null = null;

async function getDb(): Promise<IDBPDatabase<MechzieDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<MechzieDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // User profile data
      if (!db.objectStoreNames.contains('userData')) {
        db.createObjectStore('userData', { keyPath: 'id' });
      }

      // Dashboard widget data
      if (!db.objectStoreNames.contains('dashboardData')) {
        db.createObjectStore('dashboardData', { keyPath: 'id' });
      }

      // General API response cache
      if (!db.objectStoreNames.contains('apiCache')) {
        db.createObjectStore('apiCache', { keyPath: 'url' });
      }

      // Pending mutations queue
      if (!db.objectStoreNames.contains('pendingActions')) {
        const store = db.createObjectStore('pendingActions', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-timestamp', 'timestamp');
      }
    },
  });

  return dbInstance;
}

// ── User Data ──────────────────────────────────────────────

export async function cacheUserData(userId: string, data: any): Promise<void> {
  const db = await getDb();
  await db.put('userData', {
    id: userId,
    data,
    timestamp: Date.now(),
  });
}

export async function getCachedUserData(userId: string): Promise<any | null> {
  const db = await getDb();
  const record = await db.get('userData', userId);
  return record?.data ?? null;
}

// ── Dashboard Data ─────────────────────────────────────────

export async function cacheDashboardData(
  key: string,
  data: any
): Promise<void> {
  const db = await getDb();
  await db.put('dashboardData', {
    id: key,
    data,
    timestamp: Date.now(),
  });
}

export async function getCachedDashboardData(key: string): Promise<any | null> {
  const db = await getDb();
  const record = await db.get('dashboardData', key);
  return record?.data ?? null;
}

// ── API Response Cache ─────────────────────────────────────

const DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes

export async function cacheApiResponse(
  url: string,
  data: any,
  ttl = DEFAULT_TTL
): Promise<void> {
  const db = await getDb();
  await db.put('apiCache', {
    url,
    data,
    timestamp: Date.now(),
    ttl,
  });
}

export async function getCachedApiResponse(url: string): Promise<any | null> {
  const db = await getDb();
  const record = await db.get('apiCache', url);

  if (!record) return null;

  // Check if cache has expired
  const isExpired = Date.now() - record.timestamp > record.ttl;
  if (isExpired) {
    await db.delete('apiCache', url);
    return null;
  }

  return record.data;
}

// ── Pending Actions Queue ──────────────────────────────────

export async function queuePendingAction(
  method: string,
  url: string,
  data?: any
): Promise<void> {
  const db = await getDb();
  await db.add('pendingActions', {
    method,
    url,
    data,
    timestamp: Date.now(),
  });
}

export async function getPendingActions(): Promise<
  Array<{
    id?: number;
    method: string;
    url: string;
    data?: any;
    timestamp: number;
  }>
> {
  const db = await getDb();
  return db.getAllFromIndex('pendingActions', 'by-timestamp');
}

export async function removePendingAction(id: number): Promise<void> {
  const db = await getDb();
  await db.delete('pendingActions', id);
}

export async function clearPendingActions(): Promise<void> {
  const db = await getDb();
  await db.clear('pendingActions');
}

// ── Cache Cleanup ──────────────────────────────────────────

export async function clearAllCaches(): Promise<void> {
  const db = await getDb();
  await Promise.all([
    db.clear('userData'),
    db.clear('dashboardData'),
    db.clear('apiCache'),
    db.clear('pendingActions'),
  ]);
}

export async function clearExpiredCaches(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('apiCache', 'readwrite');
  const store = tx.objectStore('apiCache');
  let cursor = await store.openCursor();

  while (cursor) {
    const record = cursor.value;
    if (Date.now() - record.timestamp > record.ttl) {
      await cursor.delete();
    }
    cursor = await cursor.continue();
  }

  await tx.done;
}
