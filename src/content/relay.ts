// Content Script runs in ISOLATED world
// Relays messages between USER_SCRIPT world and BACKGROUND

import { Readability } from '@mozilla/readability';

// Handle messages from sidepanel/background for page content extraction and abort
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'extract-page-content') {
    try {
      // Use DOMParser instead of cloneNode to avoid Custom Elements registry issues
      const parser = new DOMParser();
      const documentClone = parser.parseFromString(document.documentElement.outerHTML, 'text/html');
      const reader = new Readability(documentClone);
      const article = reader.parse();

      if (article) {
        sendResponse({
          success: true,
          title: article.title || document.title,
          content: article.textContent || '',
          length: article.textContent?.length || 0,
        });
      } else {
        // Fallback: use body text if Readability fails
        const bodyText = document.body?.innerText || '';
        sendResponse({
          success: true,
          title: document.title,
          content: bodyText,
          length: bodyText.length,
        });
      }
    } catch (error: any) {
      // Fallback for Custom Elements or other cloning errors
      console.warn('Readability extraction failed, using fallback:', error.message);
      try {
        const bodyText = document.body?.innerText || '';
        sendResponse({
          success: true,
          title: document.title,
          content: bodyText,
          length: bodyText.length,
        });
      } catch {
        sendResponse({
          success: false,
          error: error.message,
        });
      }
    }
    return true; // Keep channel open for async response
  } else if (message.type === 'abort-script') {
    // Dispatch abort event to USER_SCRIPT world
    window.dispatchEvent(
      new CustomEvent(`dify-abort-${message.scriptId}`)
    );
    sendResponse({ success: true });
    return false;
  } else if (message.type === 'get-selected-text') {
    // Return currently selected text on the page
    const selection = window.getSelection()?.toString() || '';
    sendResponse({ success: true, text: selection });
    return false;
  }

  // For unhandled message types, return false to indicate we won't send a response
  return false;
});

// Deliberately no window message listener. Page JavaScript is untrusted and
// must never be able to relay privileged Dify requests through this script.
