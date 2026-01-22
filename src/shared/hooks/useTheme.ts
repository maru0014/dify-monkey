import { useEffect } from 'react';
import { useDifySettings } from './useDifySettings';

/**
 * テーマを適用するカスタムフック
 * 設定に基づいてHTML要素にdarkクラスを追加/削除する
 */
export function useTheme() {
  const { settings, loading } = useDifySettings();

  useEffect(() => {
    if (loading || !settings) return;

    const applyTheme = (theme: 'system' | 'light' | 'dark') => {
      const root = document.documentElement;

      if (theme === 'system') {
        // システム設定に従う
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      } else if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    // 初期適用
    applyTheme(settings.theme);

    // システムテーマが変更された場合のリスナー
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings, loading]);

  return { settings, loading };
}
