import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encrypt, decrypt } from '../../src/utils/encryption';

describe('Encryption Utility', () => {
  const originalEnv = process.env.ENCRYPTION_KEY;
  const validKey = Buffer.from('a'.repeat(32)).toString('base64');

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = validKey;
  });

  afterEach(() => {
    process.env.ENCRYPTION_KEY = originalEnv;
  });

  describe('encrypt', () => {
    it('should encrypt plaintext successfully', () => {
      const plaintext = 'test-token-123';
      const ciphertext = encrypt(plaintext);

      expect(ciphertext).toBeTruthy();
      expect(ciphertext.split(':')).toHaveLength(3);
    });

    it('should produce different ciphertexts for same plaintext', () => {
      const plaintext = 'test-token';
      const ciphertext1 = encrypt(plaintext);
      const ciphertext2 = encrypt(plaintext);

      expect(ciphertext1).not.toBe(ciphertext2);
    });

    it('should throw error for empty string', () => {
      expect(() => encrypt('')).toThrow('Plaintext must be a non-empty string');
    });

    it('should throw error for non-string input', () => {
      expect(() => encrypt(null as any)).toThrow('Plaintext must be a non-empty string');
      expect(() => encrypt(undefined as any)).toThrow('Plaintext must be a non-empty string');
      expect(() => encrypt(123 as any)).toThrow('Plaintext must be a non-empty string');
    });

    it('should throw error when ENCRYPTION_KEY is missing', () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY environment variable is not set');
    });

    it('should throw error for invalid key length', () => {
      process.env.ENCRYPTION_KEY = Buffer.from('short').toString('base64');
      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY must be 32 bytes');
    });
  });

  describe('decrypt', () => {
    it('should decrypt ciphertext successfully', () => {
      const plaintext = 'test-token-456';
      const ciphertext = encrypt(plaintext);
      const decrypted = decrypt(ciphertext);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle round-trip encryption/decryption', () => {
      const testCases = [
        'simple-token',
        'github_pat_1234567890abcdef',
        'token with spaces',
        'token-with-special-chars!@#$%',
        '🔐 emoji token'
      ];

      testCases.forEach(plaintext => {
        const ciphertext = encrypt(plaintext);
        const decrypted = decrypt(ciphertext);
        expect(decrypted).toBe(plaintext);
      });
    });

    it('should throw error for empty string', () => {
      expect(() => decrypt('')).toThrow('Ciphertext must be a non-empty string');
    });

    it('should throw error for non-string input', () => {
      expect(() => decrypt(null as any)).toThrow('Ciphertext must be a non-empty string');
      expect(() => decrypt(undefined as any)).toThrow('Ciphertext must be a non-empty string');
    });

    it('should throw error for invalid ciphertext format', () => {
      expect(() => decrypt('invalid')).toThrow('Invalid ciphertext format');
      expect(() => decrypt('only:two')).toThrow('Invalid ciphertext format');
    });

    it('should throw error for corrupted ciphertext', () => {
      const plaintext = 'test-token';
      const ciphertext = encrypt(plaintext);
      const parts = ciphertext.split(':');
      // Corrupt the auth tag to ensure decryption fails
      const corruptedAuthTag = parts[1].slice(0, -4) + 'XXXX';
      const corrupted = `${parts[0]}:${corruptedAuthTag}:${parts[2]}`;

      expect(() => decrypt(corrupted)).toThrow('Decryption failed');
    });

    it('should throw error when ENCRYPTION_KEY is missing', () => {
      const ciphertext = encrypt('test');
      delete process.env.ENCRYPTION_KEY;

      expect(() => decrypt(ciphertext)).toThrow('ENCRYPTION_KEY environment variable is not set');
    });

    it('should throw error when decrypting with wrong key', () => {
      const ciphertext = encrypt('test');
      process.env.ENCRYPTION_KEY = Buffer.from('b'.repeat(32)).toString('base64');

      expect(() => decrypt(ciphertext)).toThrow('Decryption failed');
    });
  });

  describe('security properties', () => {
    it('should not expose plaintext in error messages', () => {
      const sensitiveData = 'secret-password-123';
      const ciphertext = encrypt(sensitiveData);
      const corrupted = ciphertext.replace(/.$/, 'X');

      try {
        decrypt(corrupted);
      } catch (error: any) {
        expect(error.message).not.toContain(sensitiveData);
      }
    });

    it('should not expose key in error messages', () => {
      delete process.env.ENCRYPTION_KEY;

      try {
        encrypt('test');
      } catch (error: any) {
        expect(error.message).not.toContain(validKey);
      }
    });
  });
});
