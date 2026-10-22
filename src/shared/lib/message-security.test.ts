import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { generateBridgeCode } from './bridge';
import { isExtensionPageSender, isUserScriptSender } from './message-security';

const mocks = vi.hoisted(() => ({
  get: vi.fn(), run: vi.fn(), upload: vi.fn(), key: vi.fn(),
}));
vi.mock('./storage', () => ({ storage: { get: mocks.get, init: vi.fn() } }));
vi.mock('./api-key-helper', () => ({ getPlaintextApiKey: mocks.key }));
vi.mock('../api/dify-client', () => ({ DifyClient: class {
  runWorkflow = mocks.run;
  uploadFile = mocks.upload;
} }));
const event = () => ({ addListener: vi.fn() });
const sender = { id: 'extension-id', tab: { id: 7 }, frameId: 0, documentId: 'doc-1', url: 'https://example.com/' };
let api: any;

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  api = {
    runtime: { id: 'extension-id', onMessage: event(), onUserScriptMessage: event(),
      onConnect: event(), onInstalled: event(), onStartup: event(), sendMessage: vi.fn() },
    contextMenus: { onClicked: event(), removeAll: vi.fn() }, storage: { onChanged: event() },
    action: { onClicked: event() }, tabs: { sendMessage: vi.fn() },
    userScripts: { register: vi.fn(), configureWorld: vi.fn(), unregister: vi.fn() },
  };
  vi.stubGlobal('chrome', api);
  mocks.get.mockImplementation(async (key: string) => key === 'settings' ? { difyBaseUrl: 'https://example.invalid/v1' } : { app: { apiKey: 'dummy-key' } });
  mocks.key.mockResolvedValue('dummy-key');
  mocks.run.mockResolvedValue({ output: 'private-result' });
  mocks.upload.mockResolvedValue({ id: 'dummy-file' });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

async function handlers() {
  await import('../../background/index');
  return { ordinary: api.runtime.onMessage.addListener.mock.calls[0][0],
    user: api.runtime.onUserScriptMessage.addListener.mock.calls[0]?.[0],
    connect: api.runtime.onConnect.addListener.mock.calls[0][0] };
}

describe('privileged message boundary', () => {
  it.each(['workflow-run', 'file-upload', 'ui-prompt', 'log', 'script-start', 'script-done'])('ignores page-forged %s on the ordinary runtime channel', async (action) => {
    const { ordinary } = await handlers();
    expect(ordinary({ type: `dify-${action}`, payload: {} }, sender, vi.fn())).toBe(false);
    expect(mocks.get).not.toHaveBeenCalled();
    expect(mocks.key).not.toHaveBeenCalled();
    expect(mocks.run).not.toHaveBeenCalled();
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it('has no DOM-message relay for a forged same-window request', async () => {
    const listener = vi.spyOn(window, 'addEventListener');
    await import('../../content/relay');
    window.dispatchEvent(new MessageEvent('message', { source: window, data: { type: 'dify-request', action: 'workflow-run', payload: {} } }));
    expect(listener.mock.calls.filter(([type]) => type === 'message')).toHaveLength(0);
    expect(api.runtime.sendMessage).not.toHaveBeenCalled();
  });
  it.each([{ ...sender, id: 'foreign' }, { ...sender, tab: undefined }, { ...sender, documentId: undefined }, { ...sender, frameId: undefined }])('rejects invalid USER_SCRIPT sender metadata', async (invalid) => {
    const { user } = await handlers();
    const reply = vi.fn();
    expect(user({ type: 'dify-workflow-run', payload: {} }, invalid, reply)).toBe(false);
    expect(reply).toHaveBeenCalledWith({ error: 'Unauthorized user script sender' });
    expect(mocks.get).not.toHaveBeenCalled();
  });
  it('allows the dedicated USER_SCRIPT channel without broadcasting the result', async () => {
    const { user } = await handlers();
    const reply = vi.fn();
    const broadcast = vi.spyOn(window, 'postMessage');
    expect(user({ type: 'dify-workflow-run', payload: { inputs: { text: 'fixture' }, appId: 'app' } }, sender, reply)).toBe(true);
    await vi.waitFor(() => expect(reply).toHaveBeenCalledWith({ output: 'private-result' }));
    expect(mocks.run).toHaveBeenCalledWith({ text: 'fixture' });
    expect(broadcast).not.toHaveBeenCalled();
  });
  it('allows file upload through the dedicated channel', async () => {
    const { user } = await handlers();
    const reply = vi.fn();
    user({ type: 'dify-file-upload', payload: { data: 'YQ==', filename: 'fixture.txt', appId: 'app' } }, sender, reply);
    await vi.waitFor(() => expect(reply).toHaveBeenCalledWith({ id: 'dummy-file' }));
    expect(mocks.upload).toHaveBeenCalledOnce();
  });
  it('reads only the requesting document', async () => {
    const { user } = await handlers();
    api.tabs.sendMessage.mockResolvedValue({ success: true, title: 'T', content: 'C', length: 1 });
    const reply = vi.fn();
    user({ type: 'dify-page-read-content' }, sender, reply);
    await vi.waitFor(() => expect(reply).toHaveBeenCalledWith({ title: 'T', content: 'C', length: 1 }));
    expect(api.tabs.sendMessage).toHaveBeenCalledWith(7, { type: 'extract-page-content' }, { documentId: 'doc-1' });
  });
  it('rejects content-script ports even with our extension ID', async () => {
    const { connect } = await handlers();
    const port = { sender, name: 'chat-stream', disconnect: vi.fn() };
    connect(port);
    expect(port.disconnect).toHaveBeenCalledOnce();
  });
  it('distinguishes extension UI from content scripts and prefix lookalikes', () => {
    expect(isUserScriptSender(sender as chrome.runtime.MessageSender, api.runtime.id)).toBe(true);
    expect(isExtensionPageSender(sender as chrome.runtime.MessageSender, api.runtime.id)).toBe(false);
    expect(isExtensionPageSender({ id: api.runtime.id, url: 'chrome-extension://extension-id/src/prompt/index.html' }, api.runtime.id)).toBe(true);
    expect(isExtensionPageSender({ id: api.runtime.id, url: 'chrome-extension://extension-id.evil/x' }, api.runtime.id)).toBe(false);
  });
  it('enables isolated messaging during installation', async () => {
    await handlers();
    mocks.get.mockResolvedValue(undefined);
    await api.runtime.onInstalled.addListener.mock.calls[0][0]();
    expect(api.userScripts.configureWorld).toHaveBeenCalledWith(expect.objectContaining({ messaging: true }));
  });
});

describe('generated user-script bridge', () => {
  it('uses a private callback, not page-visible messages; safely quotes IDs', async () => {
    const page = { location: {}, getSelection: vi.fn() } as any;
    const broadcast = vi.fn(); page.postMessage = broadcast;
    api.runtime.sendMessage.mockImplementation((_message: any, callback: any) => callback({ value: 'secret-output' }));
    const unusual = 'script"; throw new Error("injected");//';
    new Function('window', 'chrome', generateBridgeCode(unusual, 'app"id'))(page, api);
    await expect(page.dify.workflow.run({ foo: 'bar' })).resolves.toEqual({ value: 'secret-output' });
    expect(api.runtime.sendMessage).toHaveBeenCalledWith({ type: 'dify-workflow-run', scriptId: unusual, payload: { inputs: { foo: 'bar' }, appId: 'app"id' } }, expect.any(Function));
    expect(broadcast).not.toHaveBeenCalled();
  });
  it.each(['runtime', 'background'])('propagates %s errors without fallback to DOM messaging', async (kind) => {
    const page = {} as any;
    api.runtime.sendMessage.mockImplementation((_message: any, callback: any) => {
      if (kind === 'runtime') api.runtime.lastError = { message: 'denied' };
      callback(kind === 'background' ? { error: 'denied' } : undefined);
    });
    new Function('window', 'chrome', generateBridgeCode('id'))(page, api);
    await expect(page.dify.workflow.run({})).rejects.toThrow('denied');
  });
});
