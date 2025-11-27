import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initiateOAuth, exchangeCodeForToken } from '../../src/auth/oauth.js';

describe('OAuth', () => {
  beforeEach(() => {
    process.env.GITHUB_CLIENT_ID = 'test_client_id';
    process.env.GITHUB_CLIENT_SECRET = 'test_client_secret';
    process.env.GITHUB_CALLBACK_URL = 'http://localhost:3000/callback';
  });

  describe('initiateOAuth', () => {
    it('generates OAuth URL with correct parameters', () => {
      const result = initiateOAuth();

      expect(result.url).toContain('https://github.com/login/oauth/authorize');
      expect(result.url).toContain('client_id=test_client_id');
      expect(result.url).toContain('scope=read%3Auser+read%3Arepo+write%3Astar');
      expect(result.url).toContain('code_challenge_method=S256');
      expect(result.state.state).toHaveLength(32);
      expect(result.state.codeVerifier).toBeTruthy();
    });

    it('generates unique state and verifier each time', () => {
      const result1 = initiateOAuth();
      const result2 = initiateOAuth();

      expect(result1.state.state).not.toBe(result2.state.state);
      expect(result1.state.codeVerifier).not.toBe(result2.state.codeVerifier);
    });

    it('throws error when config is missing', () => {
      delete process.env.GITHUB_CLIENT_ID;

      expect(() => initiateOAuth()).toThrow('GitHub OAuth configuration missing');
    });
  });

  describe('exchangeCodeForToken', () => {
    it('exchanges code for access token', async () => {
      const mockResponse = {
        access_token: 'gho_test_token',
        token_type: 'bearer',
        scope: 'read:user,read:repo,write:star',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const token = await exchangeCodeForToken('test_code', 'test_verifier');

      expect(token).toBe('gho_test_token');
      expect(fetch).toHaveBeenCalledWith(
        'https://github.com/login/oauth/access_token',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Accept: 'application/json',
          }),
        })
      );
    });

    it('throws error on failed exchange', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
      });

      await expect(
        exchangeCodeForToken('invalid_code', 'test_verifier')
      ).rejects.toThrow('OAuth token exchange failed');
    });

    it('throws error when no access token in response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await expect(
        exchangeCodeForToken('test_code', 'test_verifier')
      ).rejects.toThrow('No access token in response');
    });
  });
});
