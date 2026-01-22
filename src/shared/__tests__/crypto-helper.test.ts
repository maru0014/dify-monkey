/**
 * Crypto Helper Tests
 *
 * Unit tests for the encryption/decryption functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CryptoHelper } from '../lib/crypto-helper';
import { SecurityMode, type EncryptedApiKey } from '../types';

describe('CryptoHelper', () => {
  let cryptoHelper: CryptoHelper;
  const testApiKey = 'app-test-api-key-12345';
  const testPassword = 'TestPassword123!';

  beforeEach(() => {
    cryptoHelper = new CryptoHelper();
  });

  // Device Key Mode requires IndexedDB which is not available in test environment
  // These tests should be run in a browser environment or with IndexedDB mocks
  describe.skip('Device Key Mode (requires IndexedDB)', () => {
    it('should encrypt and decrypt API key with device key', async () => {
      // Encrypt
      const encrypted = await cryptoHelper.encryptWithDeviceKey(testApiKey);

      // Verify encrypted structure
      expect(encrypted).toBeDefined();
      expect(encrypted.mode).toBe(SecurityMode.DEVICE_KEY);
      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.version).toBe(1);
      expect(encrypted.salt).toBeUndefined(); // No salt for device key mode

      // Decrypt
      const decrypted = await cryptoHelper.decryptWithDeviceKey(encrypted);
      expect(decrypted).toBe(testApiKey);
    });

    it('should produce different ciphertext for same plaintext', async () => {
      const encrypted1 = await cryptoHelper.encryptWithDeviceKey(testApiKey);
      const encrypted2 = await cryptoHelper.encryptWithDeviceKey(testApiKey);

      // Same plaintext should produce different ciphertext due to random IV
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });
  });

  describe('Master Password Mode', () => {
    it('should encrypt and decrypt API key with password', async () => {
      // Encrypt
      const encrypted = await cryptoHelper.encryptWithPassword(testApiKey, testPassword);

      // Verify encrypted structure
      expect(encrypted).toBeDefined();
      expect(encrypted.mode).toBe(SecurityMode.MASTER_PASSWORD);
      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.salt).toBeDefined(); // Salt required for password mode
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.version).toBe(1);

      // Decrypt
      const decrypted = await cryptoHelper.decryptWithPassword(encrypted, testPassword);
      expect(decrypted).toBe(testApiKey);
    });

    it('should fail decryption with wrong password', async () => {
      const encrypted = await cryptoHelper.encryptWithPassword(testApiKey, testPassword);

      await expect(
        cryptoHelper.decryptWithPassword(encrypted, 'WrongPassword123!')
      ).rejects.toThrow();
    });

    it('should produce different ciphertext with same password', async () => {
      const encrypted1 = await cryptoHelper.encryptWithPassword(testApiKey, testPassword);
      const encrypted2 = await cryptoHelper.encryptWithPassword(testApiKey, testPassword);

      // Different salt and IV should produce different ciphertext
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });
  });

  describe('Generic encrypt/decrypt', () => {
    // Skip this test as it requires IndexedDB
    it.skip('should handle DEVICE_KEY mode', async () => {
      const encrypted = await cryptoHelper.encryptApiKey(testApiKey, SecurityMode.DEVICE_KEY);

      expect(typeof encrypted).toBe('object');
      expect((encrypted as EncryptedApiKey).mode).toBe(SecurityMode.DEVICE_KEY);

      const decrypted = await cryptoHelper.decryptApiKey(encrypted);
      expect(decrypted).toBe(testApiKey);
    });

    it('should handle MASTER_PASSWORD mode', async () => {
      const encrypted = await cryptoHelper.encryptApiKey(testApiKey, SecurityMode.MASTER_PASSWORD, testPassword);

      expect(typeof encrypted).toBe('object');
      expect((encrypted as EncryptedApiKey).mode).toBe(SecurityMode.MASTER_PASSWORD);

      const decrypted = await cryptoHelper.decryptApiKey(encrypted, testPassword);
      expect(decrypted).toBe(testApiKey);
    });

    it('should handle PLAINTEXT mode', async () => {
      const result = await cryptoHelper.encryptApiKey(testApiKey, SecurityMode.PLAINTEXT);

      expect(result).toBe(testApiKey);

      const decrypted = await cryptoHelper.decryptApiKey(result);
      expect(decrypted).toBe(testApiKey);
    });

    it('should throw error for MASTER_PASSWORD without password', async () => {
      await expect(
        cryptoHelper.encryptApiKey(testApiKey, SecurityMode.MASTER_PASSWORD)
      ).rejects.toThrow('Password is required');
    });
  });

  describe('Password Strength Validation', () => {
    it('should reject short passwords', () => {
      const result = cryptoHelper.validatePasswordStrength('Short1');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('8 characters');
    });

    it('should accept strong passwords', () => {
      const result = cryptoHelper.validatePasswordStrength('StrongPass123!');
      expect(result.valid).toBe(true);
    });

    it('should calculate password strength score', () => {
      expect(cryptoHelper.getPasswordStrengthScore('abc')).toBeLessThan(30);
      expect(cryptoHelper.getPasswordStrengthScore('Password123!')).toBeGreaterThan(60);
      expect(cryptoHelper.getPasswordStrengthScore('VeryStr0ng!Pass#2024')).toBeGreaterThan(80);
    });
  });
});
