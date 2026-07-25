// Persists queued upload files across sign-in / sign-up round-trips.
// Files are stored as Blobs in IndexedDB (structured clone preserves File
// objects), so a user who drops invoices, then signs in / signs up, comes
// back to find their uploads still queued and ready to extract.

const DB_NAME = "invoice-extractor-queue";
const STORE = "items";
const VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveQueue(items) {
  try {
    const db = await openDB();
    if (!db) return;
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.clear();
    for (const it of items) {
      if (it.status === "pending" && it.file) {
        store.put({ id: it.id, file: it.file, enhanced: !!it.enhanced });
      }
    }
    return new Promise((res) => {
      tx.oncomplete = () => res();
      tx.onerror = () => res();
      tx.onabort = () => res();
    });
  } catch {
    /* ignore — persistence is best-effort */
  }
}

export async function loadQueue() {
  try {
    const db = await openDB();
    if (!db) return [];
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}