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

// Listen for postMessage from USER_SCRIPT world
window.addEventListener('message', async (event: MessageEvent) => {
  // Only accept messages from the same window
  if (event.source !== window) return;

  const data = event.data;
  if (!data || data.type !== 'dify-request') return;

  const { requestId, action, payload } = data;

  if (action === 'workflow-run' || action === 'file-upload' || action === 'ui-prompt' || action === 'log' || action === 'script-start' || action === 'script-done') {
    try {
      const response = await chrome.runtime.sendMessage({
        type: `dify-${action}`,
        payload,
      });

      // Send response back via postMessage
      window.postMessage({
        type: 'dify-response',
        requestId: requestId,
        payload: response,
      }, '*');
    } catch (error: any) {
      window.postMessage({
        type: 'dify-response',
        requestId: requestId,
        error: error.message,
      }, '*');
    }
  } else if (action === 'page-read-content') {
    // Handle page content reading directly in content script
    try {
      // Use DOMParser instead of cloneNode to avoid Custom Elements registry issues
      const parser = new DOMParser();
      const documentClone = parser.parseFromString(document.documentElement.outerHTML, 'text/html');
      const reader = new Readability(documentClone);
      const article = reader.parse();

      let result;
      if (article) {
        result = {
          title: article.title || document.title,
          content: article.textContent || '',
          length: article.textContent?.length || 0,
        };
      } else {
        const bodyText = document.body?.innerText || '';
        result = {
          title: document.title,
          content: bodyText,
          length: bodyText.length,
        };
      }

      window.postMessage({
        type: 'dify-response',
        requestId: requestId,
        payload: result,
      }, '*');
    } catch (error: any) {
      window.postMessage({
        type: 'dify-response',
        requestId: requestId,
        error: error.message,
      }, '*');
    }
  }
});

console.log('Dify Monkey Content Relay loaded');
