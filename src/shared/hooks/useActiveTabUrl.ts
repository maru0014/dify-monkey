import { useState, useEffect, useRef } from 'react';

/**
 * Hook to get the current active tab's URL
 * Updates automatically when the tab updates or changes in the current window
 */
export function useActiveTabUrl(): string | null {
  const [url, setUrl] = useState<string | null>(null);
  const currentWindowIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Get the current window ID first
    chrome.windows.getCurrent((window) => {
      if (window && window.id) {
        currentWindowIdRef.current = window.id;
        // Initial update after getting window ID
        updateUrl();
      }
    });

    // Helper to update URL from tab
    const updateUrl = (_tabId?: number) => {
      chrome.tabs.query({ active: true, windowId: currentWindowIdRef.current || undefined }, (tabs) => {
        // If specific tabId provided, verify it's the active one (though query should handle it)
        const tab = tabs[0];
        if (tab) {
          setUrl(tab.url || null);
        }
      });
    };

    // Listen for tab updates (e.g. navigation)
    const onUpdated = (_tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      // Check if this update belongs to our window
      if (currentWindowIdRef.current && tab.windowId !== currentWindowIdRef.current) {
        return;
      }

      if (tab.active) {
        if (changeInfo.url) {
          setUrl(changeInfo.url);
        } else if (changeInfo.status === 'complete' && tab.url) {
          // Sometimes only status updates, ensure we have the URL
          setUrl(tab.url);
        }
      }
    };

    // Listen for tab activation (switching tabs)
    const onActivated = (activeInfo: chrome.tabs.TabActiveInfo) => {
      // Check if this activation belongs to our window
      if (currentWindowIdRef.current && activeInfo.windowId !== currentWindowIdRef.current) {
        return;
      }

      // We need to fetch the tab info to get the URL as activeInfo only has IDs
      // Instead of getting specific tab, just query active tab in current usage to be safe
      updateUrl();
    };

    // Add listeners
    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.onActivated.addListener(onActivated);

    // Initial fetch (also called after window ID resolution, but good to have immediate attempt)
    // Note: This initial call might target the wrong window if multiple are open,
    // but the window ID resolution will correct it shortly.
    updateUrl();

    // Cleanup
    return () => {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onActivated.removeListener(onActivated);
    };
  }, []);

  return url;
}
