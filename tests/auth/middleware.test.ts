import { describe, it, expect, beforeEach } from 'vitest';
import { extractToken, authenticate } from '../../src/auth/middleware.js';
import { createSession } from '../../src/auth/session.js';

describe('Auth Middleware', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = Buffer.from('test_secret_key_32_bytes_long!').toString('base64');
  });

  describe('extractToken', () => {
    it('extracts token from Bearer header', () => {
      const token = extractToken('Bearer test_token_123');
      expect(token).toBe('test_token_123');
    });

    it('returns null for missing header', () => {
      expect(extractToken()).toBeNull();
      expect(extractToken('')).toBeNull();
    });

    it('returns null for invalid format', () => {
      expect(extractToken('test_token_123')).toBeNull();
      expect(extractToken('Basic test_token_123')).toBeNull();
    });
  });

  describe('authenticate', () => {
    it('authenticates valid token', () => {
      const payload = {
        userId: 1,
        githubId: '12345',
        githubUsername: 'testuser',
      };

      const token = createSession(payload);
      const result = authenticate(`Bearer ${token}`);

      expect(result.userId).toBe(payload.userId);
      expect(result.githubId).toBe(payload.githubId);
      expect(result.githubUsername).toBe(payload.githubUsername);
    });

    it('throws error for missing token', () => {
      expect(() => authenticate()).toThrow('No authentication token provided');
      expect(() => authenticate('')).toThrow('No authentication token provided');
    });

    it('throws error for invalid token', () => {
      expect(() => authenticate('Bearer invalid_token')).toThrow(
        'Invalid or expired session token'
      );
    });
  });
});
