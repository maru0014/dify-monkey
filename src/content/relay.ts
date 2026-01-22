// Content Script runs in ISOLATED world
// Relays messages between USER_SCRIPT world and BACKGROUND

import { Readability } from '@mozilla/readability';

// Handle messages from sidepanel/background for page content extraction and abort
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'extract-page-content') {
    try {
      // Clone the document to avoid modifying the original
      const documentClone = document.cloneNode(true) as Document;
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
      sendResponse({
        success: false,
        error: error.message,
      });
    }
    return true; // Keep channel open for async response
  } else if (message.type === 'abort-script') {
    // Dispatch abort event to USER_SCRIPT world
    window.dispatchEvent(
      new CustomEvent(`dify-abort-${message.scriptId}`)
    );
    sendResponse({ success: true });
    return false;
  }

  // For unhandled message types, return false to indicate we won't send a response
  return false;
});

// Listen for custom events from USER_SCRIPT world
window.addEventListener('dify-request', async (event: Event) => {
  const customEvent = event as CustomEvent;
  const { requestId, type, payload } = customEvent.detail;

  if (type === 'workflow-run' || type === 'file-upload' || type === 'ui-prompt' || type === 'log' || type === 'script-start' || type === 'script-done') {
    try {
      const response = await chrome.runtime.sendMessage({
        type: `dify-${type}`,
        payload,
      });

      // Dispatch response back to USER_SCRIPT world
      window.dispatchEvent(
        new CustomEvent(`dify-response-${requestId}`, {
          detail: response,
        })
      );
    } catch (error: any) {
      window.dispatchEvent(
        new CustomEvent(`dify-response-${requestId}`, {
          detail: { error: error.message },
        })
      );
    }
  } else if (type === 'page-read-content') {
    // Handle page content reading directly in content script
    try {
      const documentClone = document.cloneNode(true) as Document;
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

      window.dispatchEvent(
        new CustomEvent(`dify-response-${requestId}`, {
          detail: result,
        })
      );
    } catch (error: any) {
      window.dispatchEvent(
        new CustomEvent(`dify-response-${requestId}`, {
          detail: { error: error.message },
        })
      );
    }
  }
});

console.log('Dify Monkey Content Relay loaded');
