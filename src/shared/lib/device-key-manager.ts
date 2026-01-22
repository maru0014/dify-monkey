/**
 * Device Key Manager
 *
 * Manages device-specific encryption keys stored in IndexedDB.
 * This provides automatic encryption without requiring user password input.
 */

const DB_NAME = 'dify-monkey-secure';
const STORE_NAME = 'device-keys';
const KEY_ID = 'main-device-key';
const DB_VERSION = 1;

export class DeviceKeyManager {
  private db: IDBDatabase | null = null;

  /**
   * Open the IndexedDB database
   */
  private async openDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  /**
   * Load device key from IndexedDB
   */
  private async loadKeyFromDB(): Promise<CryptoKey | null> {
    const db = await this.openDB();

    return new Promise<CryptoKey | null>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(KEY_ID);

      request.onsuccess = async () => {
        const keyData = request.result;

        if (!keyData) {
          resolve(null);
          return;
        }

        try {
          // Import the key from JWK format
          const key = await crypto.subtle.importKey(
            'jwk',
            keyData,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
          );
          resolve(key);
        } catch (error) {
          console.error('[DeviceKeyManager] Failed to import key:', error);
          resolve(null);
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to load key from IndexedDB'));
      };
    });
  }

  /**
   * Save device key to IndexedDB
   */
  private async saveKeyToDB(key: CryptoKey): Promise<void> {
    const db = await this.openDB();

    // Export key to JWK format for storage
    const keyData = await crypto.subtle.exportKey('jwk', key);

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(keyData, KEY_ID);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to save key to IndexedDB'));
      };
    });
  }

  /**
   * Get or create device key
   * If no key exists, generates a new one automatically
   */
  async getOrCreateDeviceKey(): Promise<CryptoKey> {
    let key = await this.loadKeyFromDB();

    if (!key) {
      console.log('[DeviceKeyManager] Generating new device key...');

      // Generate a new AES-GCM key
      key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,  // extractable (needed to save to IndexedDB)
        ['encrypt', 'decrypt']
      );

      await this.saveKeyToDB(key);
      console.log('[DeviceKeyManager] Device key saved to IndexedDB');
    }

    return key;
  }

  /**
   * Delete device key from IndexedDB
   * Used when switching to a different security mode
   */
  async deleteDeviceKey(): Promise<void> {
    const db = await this.openDB();

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(KEY_ID);

      request.onsuccess = () => {
        console.log('[DeviceKeyManager] Device key deleted');
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete key from IndexedDB'));
      };
    });
  }

  /**
   * Check if device key exists
   */
  async hasDeviceKey(): Promise<boolean> {
    try {
      const key = await this.loadKeyFromDB();
      return key !== null;
    } catch (error) {
      console.error('[DeviceKeyManager] Failed to check for device key:', error);
      return false;
    }
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
export const deviceKeyManager = new DeviceKeyManager();
