import { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { DifyApp } from '../types';

export function useDifyApps() {
  const [apps, setApps] = useState<DifyApp[]>([]);
  const [loading, setLoading] = useState(true);

  const loadApps = async () => {
    setLoading(true);
    try {
      const appMap = await storage.get('difyApps');
      if (appMap) {
        setApps(Object.values(appMap).sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setApps([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApps();
  }, []);

  const addApp = async (app: Omit<DifyApp, 'createdAt'>) => {
    const newApp: DifyApp = { ...app, createdAt: Date.now() };
    const currentApps = await storage.get('difyApps') || {};
    currentApps[newApp.id] = newApp;
    await storage.set('difyApps', currentApps);
    setApps(Object.values(currentApps).sort((a, b) => b.createdAt - a.createdAt));
  };

  const removeApp = async (id: string) => {
    const currentApps = await storage.get('difyApps') || {};
    delete currentApps[id];
    await storage.set('difyApps', currentApps);
    setApps(Object.values(currentApps).sort((a, b) => b.createdAt - a.createdAt));
  };

  const updateApp = async (id: string, updates: Partial<DifyApp>) => {
    const currentApps = await storage.get('difyApps') || {};
    if (currentApps[id]) {
      currentApps[id] = { ...currentApps[id], ...updates };
      await storage.set('difyApps', currentApps);
      setApps(Object.values(currentApps).sort((a, b) => b.createdAt - a.createdAt));
    }
  };

  return { apps, loading, addApp, removeApp, updateApp, reload: loadApps };
}
