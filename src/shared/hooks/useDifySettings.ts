import { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { AppSettings, SecurityMode } from '../types';

export function useDifySettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const s = await storage.get('settings');
      setSettings(s || {
        difyBaseUrl: 'https://api.dify.ai/v1',
        theme: 'system',
        securityMode: SecurityMode.DEVICE_KEY,
        sessionTimeout: 30
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateSettings = async (newSettings: AppSettings) => {
    await storage.set('settings', newSettings);
    setSettings(newSettings);
  };

  return { settings, loading, updateSettings, reload: loadSettings };
}
