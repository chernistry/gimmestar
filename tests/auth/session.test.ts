import { describe, it, expect, beforeEach } from 'vitest';
import { createSession, verifySession } from '../../src/auth/session.js';

describe('Session', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = Buffer.from('test_secret_key_32_bytes_long!').toString('base64');
  });

  describe('createSession', () => {
    it('creates valid JWT token', () => {
      const payload = {
        userId: 1,
        githubId: '12345',
        githubUsername: 'testuser',
      };

      const token = createSession(payload);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('throws error when SESSION_SECRET is missing', () => {
      delete process.env.SESSION_SECRET;

      expect(() =>
        createSession({ userId: 1, githubId: '123', githubUsername: 'test' })
      ).toThrow('SESSION_SECRET environment variable is not set');
    });
  });

  describe('verifySession', () => {
    it('verifies valid token and returns payload', () => {
      const payload = {
        userId: 1,
        githubId: '12345',
        githubUsername: 'testuser',
      };

      const token = createSession(payload);
      const verified = verifySession(token);

      expect(verified.userId).toBe(payload.userId);
      expect(verified.githubId).toBe(payload.githubId);
      expect(verified.githubUsername).toBe(payload.githubUsername);
    });

    it('throws error for invalid token', () => {
      expect(() => verifySession('invalid.token.here')).toThrow(
        'Invalid or expired session token'
      );
    });

    it('throws error for tampered token', () => {
      const payload = {
        userId: 1,
        githubId: '12345',
        githubUsername: 'testuser',
      };

      const token = createSession(payload);
      const tampered = token.slice(0, -5) + 'xxxxx';

      expect(() => verifySession(tampered)).toThrow(
        'Invalid or expired session token'
      );
    });
  });
});
