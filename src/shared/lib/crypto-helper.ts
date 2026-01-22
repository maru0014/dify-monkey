/**
 * Crypto Helper
 *
 * Provides encryption/decryption functionality for all three security modes:
 * 1. Device Key Mode: Automatic encryption with device-specific key
 * 2. Master Password Mode: Password-based encryption
 * 3. Plaintext Mode: No encryption (legacy)
 */

import { SecurityMode, type EncryptedApiKey } from '../types';
import { deviceKeyManager } from './device-key-manager';

// Configuration
const PBKDF2_ITERATIONS = 100000;  // High iteration count for security
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

export class CryptoHelper {
  /**
   * Generate random salt
   */
  private generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  }

  /**
   * Generate random IV (Initialization Vector)
   */
  private generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  }

  /**
   * Convert Uint8Array or ArrayBuffer to Base64 string
   */
  private arrayBufferToBase64(buffer: Uint8Array | ArrayBuffer): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 string to Uint8Array
   */
  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Derive key from password using PBKDF2
   */
  private async deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as a key
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive AES-GCM key from password
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,  // Type assertion for compatibility
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt plaintext with AES-GCM
   */
  private async encrypt(plaintext: string, key: CryptoKey, iv: Uint8Array): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    return crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource  // Type assertion for compatibility
      },
      key,
      data
    );
  }

  /**
   * Decrypt ciphertext with AES-GCM
   */
  private async decrypt(ciphertext: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<string> {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource  // Type assertion for compatibility
      },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Encrypt API key with device key (DEVICE_KEY mode)
   */
  async encryptWithDeviceKey(apiKey: string): Promise<EncryptedApiKey> {
    const deviceKey = await deviceKeyManager.getOrCreateDeviceKey();
    const iv = this.generateIV();

    const encrypted = await this.encrypt(apiKey, deviceKey, iv);

    return {
      mode: SecurityMode.DEVICE_KEY,
      encrypted: this.arrayBufferToBase64(encrypted as ArrayBuffer),
      iv: this.arrayBufferToBase64(iv),
      version: 1
    };
  }

  /**
   * Decrypt API key with device key (DEVICE_KEY mode)
   */
  async decryptWithDeviceKey(encryptedData: EncryptedApiKey): Promise<string> {
    const deviceKey = await deviceKeyManager.getOrCreateDeviceKey();
    const ciphertext = this.base64ToArrayBuffer(encryptedData.encrypted).buffer as ArrayBuffer;  // Type assertion
    const iv = this.base64ToArrayBuffer(encryptedData.iv);

    return this.decrypt(ciphertext, deviceKey, iv);
  }

  /**
   * Create a password hash for verification
   * Uses SHA-256 with salt
   */
  async createPasswordHash(password: string, salt: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64(hashBuffer);
  }

  /**
   * Generate a random salt for password hashing
   */
  generatePasswordSalt(): string {
    const salt = this.generateSalt();
    return this.arrayBufferToBase64(salt);
  }

  /**
   * Encrypt API key with master password (MASTER_PASSWORD mode)
   */
  async encryptWithPassword(apiKey: string, password: string): Promise<EncryptedApiKey> {
    const salt = this.generateSalt();
    const iv = this.generateIV();

    const key = await this.deriveKeyFromPassword(password, salt);
    const encrypted = await this.encrypt(apiKey, key, iv);

    return {
      mode: SecurityMode.MASTER_PASSWORD,
      encrypted: this.arrayBufferToBase64(encrypted as ArrayBuffer),
      salt: this.arrayBufferToBase64(salt),
      iv: this.arrayBufferToBase64(iv),
      version: 1
    };
  }

  /**
   * Decrypt API key with master password (MASTER_PASSWORD mode)
   */
  async decryptWithPassword(encryptedData: EncryptedApiKey, password: string): Promise<string> {
    if (!encryptedData.salt) {
      throw new Error('Salt is required for password-based decryption');
    }

    const salt = this.base64ToArrayBuffer(encryptedData.salt);
    const ciphertext = this.base64ToArrayBuffer(encryptedData.encrypted).buffer as ArrayBuffer;  // Type assertion
    const iv = this.base64ToArrayBuffer(encryptedData.iv);

    const key = await this.deriveKeyFromPassword(password, salt);
    return this.decrypt(ciphertext, key, iv);
  }

  /**
   * Generic encrypt function that chooses the right method based on security mode
   */
  async encryptApiKey(apiKey: string, mode: SecurityMode, password?: string): Promise<EncryptedApiKey | string> {
    switch (mode) {
      case SecurityMode.DEVICE_KEY:
        return this.encryptWithDeviceKey(apiKey);

      case SecurityMode.MASTER_PASSWORD:
        if (!password) {
          throw new Error('Password is required for MASTER_PASSWORD mode');
        }
        return this.encryptWithPassword(apiKey, password);

      case SecurityMode.PLAINTEXT:
        // Return as-is for plaintext mode
        return apiKey;

      default:
        throw new Error(`Unknown security mode: ${mode}`);
    }
  }

  /**
   * Generic decrypt function that chooses the right method based on encrypted data
   */
  async decryptApiKey(encryptedData: EncryptedApiKey | string, password?: string): Promise<string> {
    // If it's a string, it's plaintext
    if (typeof encryptedData === 'string') {
      return encryptedData;
    }

    switch (encryptedData.mode) {
      case SecurityMode.DEVICE_KEY:
        return this.decryptWithDeviceKey(encryptedData);

      case SecurityMode.MASTER_PASSWORD:
        if (!password) {
          throw new Error('Password is required for MASTER_PASSWORD mode decryption');
        }
        return this.decryptWithPassword(encryptedData, password);

      case SecurityMode.PLAINTEXT:
        // Should not happen, but handle gracefully
        return encryptedData.encrypted;

      default:
        throw new Error(`Unknown security mode: ${encryptedData.mode}`);
    }
  }

  /**
   * Validate password strength
   * Returns true if password meets minimum requirements
   */
  validatePasswordStrength(password: string): { valid: boolean; message: string } {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const strengthCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

    if (strengthCount < 2) {
      return {
        valid: false,
        message: 'Password should include a mix of uppercase, lowercase, numbers, and special characters'
      };
    }

    return { valid: true, message: 'Password is strong' };
  }

  /**
   * Calculate password strength score (0-100)
   */
  getPasswordStrengthScore(password: string): number {
    let score = 0;

    // Length score (max 40 points)
    score += Math.min(password.length * 4, 40);

    // Complexity score (max 60 points)
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 20;
    if (password.length >= 12) score += 10;

    return Math.min(score, 100);
  }
}

// Singleton instance
export const cryptoHelper = new CryptoHelper();
