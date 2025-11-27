import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

// Mock database before any imports
vi.mock('../../src/config/database', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 1, githubId: '123', githubUsername: 'testuser' }]),
        }),
      }),
    }),
  },
}));

vi.mock('../../src/auth/oauth', () => ({
  exchangeCodeForToken: vi.fn(),
}));

vi.mock('../../src/auth/session', () => ({
  createSession: vi.fn().mockReturnValue('mock-session-token'),
}));

vi.mock('../../src/utils/encryption', () => ({
  encrypt: vi.fn().mockReturnValue('encrypted-token'),
}));

// Mock fetch globally
global.fetch = vi.fn();

import { handleGitHubCallback } from '../../src/api/routes/auth';
import { Request, Response } from '../../src/api/types';
import { exchangeCodeForToken } from '../../src/auth/oauth';

describe('Auth API', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonSpy: ReturnType<typeof vi.fn>;
  let errorSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    jsonSpy = vi.fn();
    errorSpy = vi.fn();
    mockReq = { body: {} };
    mockRes = { json: jsonSpy, error: errorSpy };
    
    // Setup default fetch mock
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 123, login: 'testuser' }),
    });
  });

  describe('POST /api/auth/github', () => {
    it('should return 400 when code is missing', async () => {
      mockReq.body = { codeVerifier: 'test-verifier' };

      await handleGitHubCallback(mockReq as Request, mockRes as Response);

      expect(errorSpy).toHaveBeenCalledWith('Missing code or codeVerifier', 400);
    });

    it('should return 400 when codeVerifier is missing', async () => {
      mockReq.body = { code: 'test-code' };

      await handleGitHubCallback(mockReq as Request, mockRes as Response);

      expect(errorSpy).toHaveBeenCalledWith('Missing code or codeVerifier', 400);
    });

    it('should return 401 on OAuth failure', async () => {
      vi.mocked(exchangeCodeForToken).mockRejectedValue(new Error('OAuth failed'));

      mockReq.body = { code: 'test-code', codeVerifier: 'test-verifier' };

      await handleGitHubCallback(mockReq as Request, mockRes as Response);

      expect(errorSpy).toHaveBeenCalledWith('Authentication failed', 401);
    });

    it('should return session token on successful authentication', async () => {
      vi.mocked(exchangeCodeForToken).mockResolvedValue('github-access-token');

      mockReq.body = { code: 'test-code', codeVerifier: 'test-verifier' };

      await handleGitHubCallback(mockReq as Request, mockRes as Response);

      expect(jsonSpy).toHaveBeenCalledWith({
        token: 'mock-session-token',
        user: { id: 1, username: 'testuser' },
      });
    });
  });
});
