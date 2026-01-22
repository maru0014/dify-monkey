/**
 * API Key Helper
 *
 * Helper functions to handle both encrypted and plaintext API keys
 */

import { type EncryptedApiKey, SecurityMode } from '../types';
import { cryptoHelper } from './crypto-helper';

/**
 * Check if API key is encrypted
 */
export function isEncryptedApiKey(apiKey: EncryptedApiKey | string): apiKey is EncryptedApiKey {
  return typeof apiKey === 'object' && 'encrypted' in apiKey && 'mode' in apiKey;
}

/**
 * Get plaintext API key from encrypted or plaintext format
 * For display purposes (masking), we need the raw string
 *
 * @param apiKey - Encrypted or plaintext API key
 * @param password - Master password (required if API key is encrypted with master password)
 * @returns Promise<string> - Plaintext API key
 */
export async function getPlaintextApiKey(
  apiKey: EncryptedApiKey | string,
  password?: string
): Promise<string> {
  if (typeof apiKey === 'string') {
    // Already plaintext
    return apiKey;
  }

  // Decrypt the API key
  return await cryptoHelper.decryptApiKey(apiKey, password);
}

/**
 * Mask API key for display (first 4 + ••••••• + last 4)
 * Works with both encrypted and plaintext API keys
 *
 * @param apiKey - Encrypted or plaintext API key
 * @param password - Master password (optional, only needed if encrypted with master password)
 * @returns Promise<string> - Masked API key
 */
export async function maskApiKey(
  apiKey: EncryptedApiKey | string,
  password?: string
): Promise<string> {
  try {
    const plaintext = await getPlaintextApiKey(apiKey, password);

    if (plaintext.length <= 12) {
      return '•'.repeat(plaintext.length);
    }

    return `${plaintext.slice(0, 4)}${'•'.repeat(7)}${plaintext.slice(-4)}`;
  } catch (error) {
    // If decryption fails, return a generic masked string
    console.error('[ApiKeyHelper] Failed to decrypt API key for masking:', error);
    return '••••••••••••';
  }
}

/**
 * Get security mode from API key
 */
export function getApiKeySecurityMode(apiKey: EncryptedApiKey | string): SecurityMode {
  if (typeof apiKey === 'string') {
    return SecurityMode.PLAINTEXT;
  }
  return apiKey.mode;
}
