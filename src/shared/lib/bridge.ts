/**
 * Dify Bridge Code Generator
 *
 * This module generates the bridge code that is prepended to user scripts.
 * The bridge provides the `dify` global object with workflow, storage, and UI APIs.
 */

/**
 * Generates the bridge code string to be prepended to user scripts.
 * This code runs in USER_SCRIPT world and communicates with Content Script via CustomEvents.
 */
export function generateBridgeCode(scriptId: string, linkedAppId?: string): string {
  return `
// === Dify Monkey Bridge Code ===
(function() {
  const SCRIPT_ID = "${scriptId}";
  const LINKED_APP_ID = ${linkedAppId ? `"${linkedAppId}"` : 'undefined'};

  // Generate unique request ID
  function generateRequestId() {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Send request to Content Script and wait for response
  // Uses postMessage for cross-world communication (USER_SCRIPT <-> ISOLATED)
  function sendRequest(type, payload) {
    return new Promise((resolve, reject) => {
      const requestId = generateRequestId();

      // Listen for response via postMessage
      const responseHandler = (event) => {
        // Only accept messages from the same window
        if (event.source !== window) return;

        const data = event.data;
        if (!data || data.type !== 'dify-response' || data.requestId !== requestId) return;

        window.removeEventListener('message', responseHandler);

        if (data.error) {
          reject(new Error(data.error));
        } else {
          resolve(data.payload);
        }
      };

      window.addEventListener('message', responseHandler);

      // Send request via postMessage
      window.postMessage({
        type: 'dify-request',
        requestId: requestId,
        action: type,
        payload: payload
      }, '*');

      // Timeout after 60 seconds
      setTimeout(() => {
        window.removeEventListener('message', responseHandler);
        reject(new Error('Request timeout'));
      }, 60000);
    });
  }

  // Toast notification styles
  const toastStyles = \`
    .dify-toast-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .dify-toast {
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: dify-toast-in 0.3s ease-out;
      max-width: 300px;
    }
    .dify-toast.success { background: #10b981; }
    .dify-toast.error { background: #ef4444; }
    .dify-toast.info { background: #3b82f6; }
    @keyframes dify-toast-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes dify-toast-out {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-10px); }
    }
  \`;

  // Inject toast styles
  function ensureToastStyles() {
    if (!document.getElementById('dify-toast-styles')) {
      const style = document.createElement('style');
      style.id = 'dify-toast-styles';
      style.textContent = toastStyles;
      document.head.appendChild(style);
    }
  }

  // Get or create toast container
  function getToastContainer() {
    let container = document.getElementById('dify-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'dify-toast-container';
      container.className = 'dify-toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  // Storage key prefix for this script
  const STORAGE_PREFIX = 'dify_script_' + SCRIPT_ID + '_';

  // Define the global dify object
  window.dify = {
    // Internal state for abort handling
    _aborted: false,

    /**
     * Notify that script execution has started.
     * Called automatically when executed from sidepanel.
     */
    start: function() {
      sendRequest('script-start', { scriptId: SCRIPT_ID }).catch(function(err) {
        console.error('[Dify] Start notification error:', err);
      });
    },

    /**
     * Notify that script execution has completed.
     * Called automatically when executed from sidepanel.
     * @param {Object} result - Optional result object
     */
    done: function(result) {
      sendRequest('script-done', { scriptId: SCRIPT_ID, result: result }).catch(function(err) {
        console.error('[Dify] Done notification error:', err);
      });
    },

    /**
     * Register a callback to be called when script is aborted.
     * @param {Function} callback - Function to call on abort
     */
    onAbort: function(callback) {
      window.addEventListener('dify-abort-' + SCRIPT_ID, function() {
        window.dify._aborted = true;
        if (callback) callback();
      });
    },

    /**
     * Check if the script has been aborted.
     * @returns {boolean} True if aborted
     */
    isAborted: function() {
      return window.dify._aborted;
    },

    workflow: {
      /**
       * Run a Dify workflow and return the result.
       * @param {Object} inputs - Input parameters for the workflow
       * @param {Object} options - Optional settings (appId to use a specific app)
       * @returns {Promise<Object>} Workflow result
       */
      run: async function(inputs, options) {
        if (window.dify._aborted) {
          throw new Error('Script has been aborted');
        }
        const payload = {
          inputs: inputs || {},
          appId: (options && options.appId) || LINKED_APP_ID
        };
        return sendRequest('workflow-run', payload);
      }
    },

    storage: {
      /**
       * Store a value in script-specific storage.
       * @param {string} key - Storage key
       * @param {*} value - Value to store
       */
      set: async function(key, value) {
        try {
          localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
        } catch (e) {
          console.error('[Dify] Storage set error:', e);
          throw e;
        }
      },

      /**
       * Retrieve a value from script-specific storage.
       * @param {string} key - Storage key
       * @returns {*} Stored value or undefined
       */
      get: async function(key) {
        try {
          const item = localStorage.getItem(STORAGE_PREFIX + key);
          return item ? JSON.parse(item) : undefined;
        } catch (e) {
          console.error('[Dify] Storage get error:', e);
          return undefined;
        }
      }
    },

    ui: {
      /**
       * Show a toast notification.
       * @param {string} message - Message to display
       * @param {string} type - 'success', 'error', or 'info'
       */
      toast: function(message, type) {
        ensureToastStyles();
        const container = getToastContainer();

        const toast = document.createElement('div');
        toast.className = 'dify-toast ' + (type || 'info');
        toast.textContent = message;
        container.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
          toast.style.animation = 'dify-toast-out 0.3s ease-out forwards';
          setTimeout(() => toast.remove(), 300);
        }, 3000);
      },

      /**
       * Show a prompt dialog.
       * @param {string} message - Prompt message
       * @returns {Promise<string|null>} User input or null if cancelled
       */
      prompt: function(message) {
        return sendRequest('ui-prompt', { message: message });
      }
    },

    page: {
      /**
       * Read the main content of the current page using Readability.
       * @returns {Promise<{title: string, content: string, length: number}>} Page content
       */
      readContent: async function() {
        return sendRequest('page-read-content', {});
      },

      /**
       * Get the current page URL.
       * @returns {string} Current page URL
       */
      getUrl: function() {
        return window.location.href;
      },

      /**
       * Get the current page title.
       * @returns {string} Current page title
       */
      getTitle: function() {
        return document.title;
      },

      /**
       * Get the selected text on the page.
       * @returns {string} Selected text or empty string
       */
      getSelection: function() {
        return window.getSelection()?.toString() || '';
      }
    },

    file: {
      /**
       * Upload a file to Dify.
       * @param {Blob|File|string} data - File data (Blob, File, or base64 string)
       * @param {string} filename - Filename with extension
       * @param {string} mimeType - Optional MIME type (autodetected from Blob/File)
       * @returns {Promise<Object>} Uploaded file info
       */
      upload: async function(data, filename, mimeType) {
        let base64Data;
        let finalMimeType = mimeType;

        if (typeof data === 'string') {
          // Assume base64 string
          base64Data = data.replace(/^data:.*?;base64,/, '');
        } else if (data instanceof Blob) {
          finalMimeType = data.type || mimeType;
          // Convert Blob/File to base64
          base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result;
              resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(data);
          });
        } else {
          throw new Error('Invalid data type. Expected Blob, File, or base64 string.');
        }

        return sendRequest('file-upload', {
          data: base64Data,
          filename: filename,
          mimeType: finalMimeType,
          appId: LINKED_APP_ID
        });
      }
    },

    /**
     * Log a message to the sidepanel history.
     * @param {string} message - Log message
     * @param {*} data - Optional data to include
     */
    log: function(message, data) {
      sendRequest('log', {
        scriptId: SCRIPT_ID,
        message: message,
        data: data
      }).catch(function(err) {
        console.error('[Dify] Log error:', err);
      });
    }
  };

  console.log('[Dify Monkey] Bridge loaded for script:', SCRIPT_ID);
})();
// === End of Dify Monkey Bridge Code ===

`;
}

/**
 * Wraps user code with the bridge.
 * @param scriptId Script ID
 * @param userCode User's script code
 * @param linkedAppId Optional linked Dify app ID
 * @returns Complete script code with bridge prepended
 */
export function wrapWithBridge(scriptId: string, userCode: string, linkedAppId?: string): string {
  return generateBridgeCode(scriptId, linkedAppId) + userCode;
}
