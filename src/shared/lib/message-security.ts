/** Chrome-supplied sender metadata, never fields supplied by a web page. */
export function isUserScriptSender(sender: chrome.runtime.MessageSender, extensionId: string): boolean {
  return sender.id === extensionId &&
    Number.isInteger(sender.tab?.id) && sender.tab!.id! >= 0 &&
    Number.isInteger(sender.frameId) && sender.frameId! >= 0 &&
    typeof sender.documentId === 'string' && sender.documentId.length > 0;
}

/** Content scripts also have our extension ID, so the URL check is essential. */
export function isExtensionPageSender(sender: chrome.runtime.MessageSender, extensionId: string): boolean {
  return sender.id === extensionId && typeof sender.url === 'string' &&
    sender.url.startsWith(`chrome-extension://${extensionId}/`);
}
