import { StorageSchema, SecurityMode } from '../types';

type StorageKey = keyof StorageSchema;

export const storage = {
  get: <K extends StorageKey>(key: K): Promise<StorageSchema[K] | undefined> => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(key, (items) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        resolve(items[key]);
      });
    });
  },

  set: <K extends StorageKey>(key: K, value: StorageSchema[K]): Promise<void> => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        resolve();
      });
    });
  },

  remove: (key: StorageKey): Promise<void> => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(key, () => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        resolve();
      });
    });
  },

  // Helper to initialize default settings
  init: async () => {
    const settings = await storage.get('settings');
    if (!settings) {
      await storage.set('settings', {
        difyBaseUrl: 'https://api.dify.ai/v1',
        theme: 'system',
        securityMode: SecurityMode.DEVICE_KEY,  // Default: automatic encryption
        sessionTimeout: 30,  // 30 minutes for master password mode
      });
    }

    const apps = await storage.get('difyApps');
    if (!apps) {
      await storage.set('difyApps', {});
    }

    const scripts = await storage.get('scripts');
    if (!scripts) {
      await storage.set('scripts', {});
    }
  }
};
