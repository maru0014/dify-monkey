import { storage } from '@/shared/lib/storage';
import { DifyClient } from '@/shared/api/dify-client';
import { WorkflowResult, UserScript, UploadedFile } from '@/shared/types';
import { wrapWithBridge, generateBridgeCode } from '@/shared/lib/bridge';
import { getPlaintextApiKey } from '@/shared/lib/api-key-helper';

// ============================================
// User Script Registration
// ============================================

/**
 * Check if userScripts API is available
 * The API requires Chrome 120+ and Developer Mode enabled
 */
function isUserScriptsAvailable(): boolean {
  return typeof chrome !== 'undefined' &&
         typeof chrome.userScripts !== 'undefined' &&
         typeof chrome.userScripts.register === 'function';
}

/**
 * Configure the USER_SCRIPT execution world
 */
async function configureUserScriptWorld(): Promise<void> {
  if (!isUserScriptsAvailable()) {
    console.warn('[Dify Monkey] userScripts API not available. Please enable Developer Mode in chrome://extensions');
    return;
  }

  try {
    await chrome.userScripts.configureWorld({
      csp: "script-src 'self' 'unsafe-inline' 'unsafe-eval';",
      messaging: false,
    });
    console.log('[Dify Monkey] USER_SCRIPT world configured');
  } catch (error) {
    console.error('[Dify Monkey] Failed to configure USER_SCRIPT world:', error);
  }
}

/**
 * Sync all user scripts with chrome.userScripts API
 * - Unregisters all existing scripts
 * - Registers enabled scripts with trigger='auto' with bridge code prepended
 */
async function syncUserScripts(): Promise<void> {
  if (!isUserScriptsAvailable()) {
    console.warn('[Dify Monkey] userScripts API not available. Scripts will not be registered.');
    console.warn('[Dify Monkey] To enable: Go to chrome://extensions and turn on "Developer mode"');
    return;
  }

  console.log('[Dify Monkey] Syncing user scripts...');

  try {
    // Unregister all existing scripts
    await chrome.userScripts.unregister();
    console.log('[Dify Monkey] Unregistered all scripts');

    // Get scripts from storage
    const scriptsMap = await storage.get('scripts');
    if (!scriptsMap) {
      console.log('[Dify Monkey] No scripts to register');
      return;
    }

    const scripts = Object.values(scriptsMap) as UserScript[];
    // Only register scripts with trigger='auto' for auto-execution
    const autoScripts = scripts.filter(s => s.enabled && s.trigger === 'auto');

    if (autoScripts.length === 0) {
      console.log('[Dify Monkey] No auto-trigger scripts to register');
      return;
    }

    // Register each enabled auto-trigger script
    const registrations = autoScripts.map(script => ({
      id: script.id,
      matches: script.matches,
      js: [{
        code: wrapWithBridge(script.id, script.code, script.linkedAppId)
      }],
      runAt: script.runAt as chrome.userScripts.RunAt,
      world: 'USER_SCRIPT' as const,
    }));

    await chrome.userScripts.register(registrations);
    console.log(`[Dify Monkey] Registered ${autoScripts.length} auto-trigger script(s)`);

  } catch (error) {
    console.error('[Dify Monkey] Failed to sync user scripts:', error);
  }
}

// ============================================
// Context Menu Management
// ============================================

/**
 * Sync context menus for scripts with trigger='context_menu'
 */
async function syncContextMenus(): Promise<void> {
  console.log('[Dify Monkey] Syncing context menus...');

  try {
    // Remove all existing context menus
    await chrome.contextMenus.removeAll();

    // Get scripts from storage
    const scriptsMap = await storage.get('scripts');
    if (!scriptsMap) {
      console.log('[Dify Monkey] No scripts for context menu');
      return;
    }

    const scripts = Object.values(scriptsMap) as UserScript[];
    // Filter scripts with trigger='context_menu' and enabled
    const contextMenuScripts = scripts.filter(s => s.enabled && s.trigger === 'context_menu');

    if (contextMenuScripts.length === 0) {
      console.log('[Dify Monkey] No context menu scripts to register');
      return;
    }

    // Create parent menu if there are multiple scripts
    if (contextMenuScripts.length > 1) {
      chrome.contextMenus.create({
        id: 'dify-monkey-parent',
        title: 'Dify Monkey',
        contexts: ['page', 'selection', 'link', 'image'],
      });

      // Create sub-menu for each script
      for (const script of contextMenuScripts) {
        chrome.contextMenus.create({
          id: `dify-script-${script.id}`,
          parentId: 'dify-monkey-parent',
          title: script.name,
          contexts: ['page', 'selection', 'link', 'image'],
          documentUrlPatterns: script.matches,
        });
      }
    } else {
      // Single script - create direct menu item
      const script = contextMenuScripts[0];
      chrome.contextMenus.create({
        id: `dify-script-${script.id}`,
        title: `Dify: ${script.name}`,
        contexts: ['page', 'selection', 'link', 'image'],
        documentUrlPatterns: script.matches,
      });
    }

    console.log(`[Dify Monkey] Created context menu for ${contextMenuScripts.length} script(s)`);

  } catch (error) {
    console.error('[Dify Monkey] Failed to sync context menus:', error);
  }
}

/**
 * Handle context menu click - execute the corresponding script
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id || !info.menuItemId) return;

  const menuId = String(info.menuItemId);
  if (!menuId.startsWith('dify-script-')) return;

  const scriptId = menuId.replace('dify-script-', '');
  console.log(`[Dify Monkey] Context menu clicked for script: ${scriptId}`);

  try {
    // Get the script from storage
    const scriptsMap = await storage.get('scripts');
    const script = scriptsMap?.[scriptId] as UserScript | undefined;

    if (!script) {
      console.error(`[Dify Monkey] Script not found: ${scriptId}`);
      return;
    }

    // Execute the script in the tab using userScripts API to avoid CSP restrictions
    const wrappedCode = wrapWithBridge(script.id, script.code, script.linkedAppId);

    if (!isUserScriptsAvailable()) {
      console.error('[Dify Monkey] userScripts API not available');
      throw new Error('userScripts API not available. Please enable Developer Mode.');
    }

    await chrome.userScripts.execute({
      target: { tabId: tab.id, allFrames: false },
      js: [{ code: wrappedCode }],
    });

    console.log(`[Dify Monkey] Executed script: ${script.name}`);

  } catch (error) {
    console.error('[Dify Monkey] Failed to execute script:', error);
  }
});

// ============================================
// Initialization
// ============================================

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  await storage.init();

  if (isUserScriptsAvailable()) {
    await configureUserScriptWorld();
    await syncUserScripts();
  } else {
    console.warn('[Dify Monkey] userScripts API not available.');
    console.warn('[Dify Monkey] Please enable Developer Mode in chrome://extensions to use user scripts.');
  }

  // Always sync context menus
  await syncContextMenus();
});

// Also sync on startup (in case of browser restart)
chrome.runtime.onStartup.addListener(async () => {
  if (isUserScriptsAvailable()) {
    await configureUserScriptWorld();
    await syncUserScripts();
  }

  // Always sync context menus
  await syncContextMenus();
});

// Watch for storage changes and re-sync scripts
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.scripts) {
    console.log('[Dify Monkey] Scripts changed, re-syncing...');
    syncUserScripts();
    syncContextMenus();
  }
});

// ============================================
// Message Handling (Workflow Execution)
// ============================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'dify-workflow-run') {
    handleWorkflowRun(message.payload)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true; // Keep channel open for async response
  } else if (message.type === 'dify-file-upload') {
    handleFileUpload(message.payload)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true; // Keep channel open for async response
  } else if (message.type === 'dify-ui-prompt') {
    handleUiPrompt(message.payload)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  } else if (message.type === 'dify-ui-prompt-response') {
    handleUiPromptResponse(message.payload);
  } else if (message.type === 'dify-log') {
    handleScriptLog(message.payload);
    sendResponse({ success: true });
    return false;
  } else if (message.type === 'dify-script-start') {
    handleScriptStart(message.payload, sender.tab?.id);
    sendResponse({ success: true });
    return false;
  } else if (message.type === 'dify-script-done') {
    handleScriptDone(message.payload, sender.tab?.id);
    sendResponse({ success: true });
    return false;
  }
});

// Set to store active sidepanel log ports
const sidepanelLogPorts = new Set<chrome.runtime.Port>();

// ============================================
// Active Script Execution Management
// ============================================

interface ActiveExecution {
  executionId: string;
  scriptId: string;
  tabId: number;
  port: chrome.runtime.Port;
  timeoutId: ReturnType<typeof setTimeout>;
  startedAt: number;
}

// Map from scriptId to active execution info
const activeExecutions = new Map<string, ActiveExecution>();

// Timeout duration (5 minutes)
const SCRIPT_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Handle script-start message from content script
 */
function handleScriptStart(payload: { scriptId: string }, _tabId?: number) {
  const { scriptId } = payload;
  console.log(`[Dify Monkey] Received script-start for: ${scriptId}`);
  const execution = activeExecutions.get(scriptId);

  if (execution) {
    console.log(`[Dify Monkey] Script started, sending 'started' message: ${scriptId}`);
    try {
      execution.port.postMessage({
        executionId: execution.executionId,
        type: 'started',
        step: 'Script is running...',
      });
    } catch (e) {
      console.error('[Dify Monkey] Failed to send started message:', e);
    }
  } else {
    console.log(`[Dify Monkey] No active execution found for scriptId: ${scriptId}`);
    console.log('[Dify Monkey] Active executions:', Array.from(activeExecutions.keys()));
  }
}

/**
 * Handle script-done message from content script
 */
function handleScriptDone(payload: { scriptId: string; result?: any }, _tabId?: number) {
  const { scriptId, result } = payload;
  console.log(`[Dify Monkey] Received script-done for: ${scriptId}`, result);
  const execution = activeExecutions.get(scriptId);

  if (execution) {
    console.log(`[Dify Monkey] Script done, sending 'complete' message: ${scriptId}`);
    clearTimeout(execution.timeoutId);
    activeExecutions.delete(scriptId);

    try {
      execution.port.postMessage({
        executionId: execution.executionId,
        type: 'complete',
        result: result || { success: true },
      });
    } catch (e) {
      // Port might be disconnected
    }
  }
}

/**
 * Abort a running script
 */
async function abortScript(scriptId: string, reason: string) {
  const execution = activeExecutions.get(scriptId);
  if (!execution) return;

  console.log(`[Dify Monkey] Aborting script: ${scriptId}, reason: ${reason}`);
  clearTimeout(execution.timeoutId);
  activeExecutions.delete(scriptId);

  // Send abort signal to the content script
  try {
    await chrome.tabs.sendMessage(execution.tabId, {
      type: 'abort-script',
      scriptId: scriptId,
    });
  } catch (e) {
    console.error('[Dify Monkey] Failed to send abort signal:', e);
  }

  // Notify sidepanel
  try {
    execution.port.postMessage({
      executionId: execution.executionId,
      type: 'error',
      error: reason,
    });
  } catch (e) {
    // Port might be disconnected
  }
}

// Handle script log messages
function handleScriptLog(payload: { scriptId: string; message: string; data?: any }) {
  const logEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    scriptId: payload.scriptId,
    scriptName: payload.scriptId, // Will be resolved on sidepanel side if needed
    message: payload.message,
    data: payload.data,
    timestamp: Date.now(),
  };

  // Broadcast to all connected sidepanel log ports
  sidepanelLogPorts.forEach((port) => {
    try {
      port.postMessage({ type: 'script-log', log: logEntry });
    } catch (e) {
      // Port might be disconnected
      sidepanelLogPorts.delete(port);
    }
  });

  console.log('[Dify Monkey] Script log:', payload.message, payload.data);
}

// Map to store pending prompt responses
const pendingPrompts = new Map<string, (response: any) => void>();

async function handleUiPrompt(payload: { message: string }): Promise<string | null> {
  const requestId = crypto.randomUUID();
  const { message } = payload;

  // Create the prompt window
  const width = 400;
  const height = 200;

  // Center window
  let left = 100;
  let top = 100;

  try {
    const lastFocused = await chrome.windows.getLastFocused();
    if (lastFocused.left !== undefined && lastFocused.top !== undefined && lastFocused.width && lastFocused.height) {
      left = lastFocused.left + (lastFocused.width - width) / 2;
      top = lastFocused.top + (lastFocused.height - height) / 2;
    }
  } catch (e) {
    // Ignore error
  }

  await chrome.windows.create({
    url: chrome.runtime.getURL(`src/prompt/index.html?message=${encodeURIComponent(message)}&requestId=${requestId}`),
    type: 'popup',
    width: Math.round(width),
    height: Math.round(height),
    left: Math.round(left),
    top: Math.round(top),
    focused: true,
  });

  return new Promise((resolve) => {
    pendingPrompts.set(requestId, resolve);
  });
}

function handleUiPromptResponse(payload: { requestId: string; value: string | null }) {
  const { requestId, value } = payload;
  const resolve = pendingPrompts.get(requestId);

  if (resolve) {
    resolve(value);
    pendingPrompts.delete(requestId);
  }
}


async function handleWorkflowRun(payload: {
  inputs: Record<string, any>;
  appId?: string;
}): Promise<WorkflowResult> {
  const { inputs, appId } = payload;

  // Get settings
  const settings = await storage.get('settings');
  if (!settings) {
    throw new Error('Settings not found. Please configure Dify connection.');
  }

  // Resolve app
  let apiKey: string;
  if (appId) {
    const apps = await storage.get('difyApps');
    const app = apps?.[appId];
    if (!app) {
      throw new Error(`Dify app not found: ${appId}`);
    }
    // Decrypt API key if encrypted
    apiKey = await getPlaintextApiKey(app.apiKey);
  } else {
    // Try to use the first available app if no appId specified
    const apps = await storage.get('difyApps');
    const firstApp = apps ? Object.values(apps)[0] : null;
    if (!firstApp) {
      throw new Error('No Dify app configured. Please add an app in settings.');
    }
    // Decrypt API key if encrypted
    apiKey = await getPlaintextApiKey(firstApp.apiKey);
  }

  const client = new DifyClient(settings.difyBaseUrl, apiKey);
  return await client.runWorkflow(inputs);
}

async function handleFileUpload(payload: {
  data: string; // base64 encoded file data
  filename: string;
  mimeType?: string;
  appId?: string;
}): Promise<UploadedFile> {
  const { data, filename, mimeType, appId } = payload;

  // Get settings
  const settings = await storage.get('settings');
  if (!settings) {
    throw new Error('Settings not found. Please configure Dify connection.');
  }

  // Resolve app for API key
  let apiKey: string;
  if (appId) {
    const apps = await storage.get('difyApps');
    const app = apps?.[appId];
    if (!app) {
      throw new Error(`Dify app not found: ${appId}`);
    }
    apiKey = await getPlaintextApiKey(app.apiKey);
  } else {
    const apps = await storage.get('difyApps');
    const firstApp = apps ? Object.values(apps)[0] : null;
    if (!firstApp) {
      throw new Error('No Dify app configured. Please add an app in settings.');
    }
    apiKey = await getPlaintextApiKey(firstApp.apiKey);
  }

  // Convert base64 to Blob
  const binaryString = atob(data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType || 'application/octet-stream' });

  const client = new DifyClient(settings.difyBaseUrl, apiKey);
  return await client.uploadFile(blob, filename);
}

// ============================================
// Port Connections (Chat Streaming)
// ============================================

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'dify-chat-stream') {
    port.onMessage.addListener(async (message) => {
      if (message.type === 'chat-send') {
        await handleChatStream(message.payload, port);
      }
    });
  } else if (port.name === 'script-execution') {
    port.onMessage.addListener(async (message) => {
      if (message.type === 'execute-script') {
        await handleScriptExecution(message.payload, port);
      } else if (message.type === 'cancel') {
        // Abort the running script
        const { scriptId } = message;
        if (scriptId) {
          await abortScript(scriptId, 'Cancelled by user');
        }
        console.log(`[Dify Monkey] Script execution cancelled: ${message.executionId}`);
      }
    });

    // Handle port disconnect - abort all scripts associated with this port
    port.onDisconnect.addListener(() => {
      for (const [scriptId, execution] of activeExecutions.entries()) {
        if (execution.port === port) {
          clearTimeout(execution.timeoutId);
          activeExecutions.delete(scriptId);
          console.log(`[Dify Monkey] Port disconnected, cleaned up execution: ${scriptId}`);
        }
      }
    });
  } else if (port.name === 'sidepanel-logs') {
    // Register sidepanel for receiving log messages
    sidepanelLogPorts.add(port);
    console.log('[Dify Monkey] Sidepanel logs port connected');

    port.onDisconnect.addListener(() => {
      sidepanelLogPorts.delete(port);
      console.log('[Dify Monkey] Sidepanel logs port disconnected');
    });
  }
});

// Handle script execution from sidepanel
async function handleScriptExecution(
  payload: {
    executionId: string;
    scriptId: string;
    scriptCode: string;
    linkedAppId?: string;
  },
  port: chrome.runtime.Port
) {
  const { executionId, scriptId, scriptCode, linkedAppId } = payload;

  console.log(`[Dify Monkey] Starting script execution: ${scriptId}`);

  try {
    // Send initial progress
    port.postMessage({
      executionId,
      type: 'progress',
      progress: 10,
      step: 'Preparing script...',
    });

    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      throw new Error('No active tab found');
    }

    port.postMessage({
      executionId,
      type: 'progress',
      progress: 30,
      step: 'Injecting script into page...',
    });

    // Get bridge code only (without user code) to avoid including scriptCode twice
    const bridgeCode = generateBridgeCode(scriptId, linkedAppId);

    // Check if user code is an async IIFE pattern like: (async () => { ... })()
    // Simplified pattern: starts with "(async" and ends with ")();" or ")()"
    const trimmedCode = scriptCode.trim();
    // Remove leading single-line comments and multi-line comments
    const codeWithoutLeadingComments = trimmedCode
      .replace(/^(\s*(\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*))+/, '')
      .trim();
    const startsWithAsyncIIFE = /^\s*\(async\s/.test(codeWithoutLeadingComments);
    const endsWithIIFECall = /\)\s*\(\s*\)\s*;?\s*$/.test(codeWithoutLeadingComments);
    const isAsyncIIFE = startsWithAsyncIIFE && endsWithIIFECall;

    console.log(`[Dify Monkey] Script code pattern detection:`, {
      startsWithAsyncIIFE,
      endsWithIIFECall,
      isAsyncIIFE,
      codePreview: codeWithoutLeadingComments.substring(0, 50) + '...'
    });

    // Wrap user code with auto start/done calls for sidepanel execution
    // If user code is already an async IIFE, await it directly
    // Otherwise, wrap it in an async function
    const wrappedCode = isAsyncIIFE
      ? `
${bridgeCode}

// Auto-wrapped execution for sidepanel (async IIFE detected)
(async () => {
  try {
    dify.start();
    await ${scriptCode}
    if (!dify._aborted) {
      dify.done({ success: true });
    }
  } catch (e) {
    dify.done({ success: false, error: e.message });
  }
})();
`
      : `
${bridgeCode}

// Auto-wrapped execution for sidepanel
(async () => {
  try {
    dify.start();
    ${scriptCode}
    if (!dify._aborted) {
      dify.done({ success: true });
    }
  } catch (e) {
    dify.done({ success: false, error: e.message });
  }
})();
`;

    // Set up timeout
    const timeoutId = setTimeout(() => {
      abortScript(scriptId, 'Script execution timed out (5 minutes)');
    }, SCRIPT_TIMEOUT_MS);

    // Store active execution info BEFORE injecting script
    // (script execution is synchronous and may complete before executeScript returns)
    activeExecutions.set(scriptId, {
      executionId,
      scriptId,
      tabId: tab.id,
      port,
      timeoutId,
      startedAt: Date.now(),
    });

    // Inject the wrapped script using userScripts API to avoid CSP restrictions
    if (!isUserScriptsAvailable()) {
      throw new Error('userScripts API not available. Please enable Developer Mode.');
    }

    await chrome.userScripts.execute({
      target: { tabId: tab.id, allFrames: false },
      js: [{ code: wrappedCode }],
    });

    port.postMessage({
      executionId,
      type: 'progress',
      progress: 50,
      step: 'Script injected, waiting for completion...',
    });

    // Note: We don't send 'complete' here anymore.
    // The script will call dify.done() which triggers handleScriptDone()

    console.log(`[Dify Monkey] Script injected, waiting for completion: ${scriptId}`);

  } catch (error: any) {
    console.error(`[Dify Monkey] Script execution error:`, error);
    activeExecutions.delete(scriptId);
    port.postMessage({
      executionId,
      type: 'error',
      error: error.message || 'Unknown error',
    });
  }
}

async function handleChatStream(
  payload: {
    query: string;
    inputs?: Record<string, any>;
    conversationId?: string | null;
    appId?: string;
  },
  port: chrome.runtime.Port
) {
  const { query, inputs = {}, conversationId, appId } = payload;

  try {
    const settings = await storage.get('settings');
    if (!settings) {
      port.postMessage({ type: 'error', error: 'Settings not configured' });
      return;
    }

    let apiKey: string;
    if (appId) {
      const apps = await storage.get('difyApps');
      const app = apps?.[appId];
      if (!app) {
        port.postMessage({ type: 'error', error: `Dify app not found: ${appId}` });
        return;
      }
      // Decrypt API key if encrypted
      apiKey = await getPlaintextApiKey(app.apiKey);
    } else {
      const apps = await storage.get('difyApps');
      const firstApp = apps ? Object.values(apps)[0] : null;
      if (!firstApp) {
        port.postMessage({ type: 'error', error: 'No Dify app configured' });
        return;
      }
      // Decrypt API key if encrypted
      apiKey = await getPlaintextApiKey(firstApp.apiKey);
    }

    const client = new DifyClient(settings.difyBaseUrl, apiKey);

    for await (const chunk of client.sendChatMessage(query, inputs, conversationId || null)) {
      port.postMessage({ type: 'chunk', data: chunk });
    }

    port.postMessage({ type: 'done' });
  } catch (error: any) {
    port.postMessage({ type: 'error', error: error.message });
  }
}

// ============================================
// Action Click Handler (Open Side Panel)
// ============================================

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

console.log('[Dify Monkey] Background Service Worker loaded');
console.log('[Dify Monkey] userScripts API available:', isUserScriptsAvailable());
