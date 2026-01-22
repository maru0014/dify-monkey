import { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { UserScript } from '../types';

export function useUserScripts() {
  const [scripts, setScripts] = useState<UserScript[]>([]);
  const [loading, setLoading] = useState(true);

  const loadScripts = async () => {
    setLoading(true);
    try {
      const scriptMap = await storage.get('scripts');
      if (scriptMap) {
        setScripts(Object.values(scriptMap).sort((a, b) => b.updatedAt - a.updatedAt));
      } else {
        setScripts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScripts();
  }, []);

  const saveScript = async (script: UserScript) => {
    const currentScripts = await storage.get('scripts') || {};
    currentScripts[script.id] = script;
    await storage.set('scripts', currentScripts);
    setScripts(Object.values(currentScripts).sort((a, b) => b.updatedAt - a.updatedAt));
  };

  const deleteScript = async (id: string) => {
    const currentScripts = await storage.get('scripts') || {};
    delete currentScripts[id];
    await storage.set('scripts', currentScripts);
    setScripts(Object.values(currentScripts).sort((a, b) => b.updatedAt - a.updatedAt));
  };

  return { scripts, loading, saveScript, deleteScript, reload: loadScripts };
}
