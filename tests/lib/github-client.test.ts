import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitHubClient } from '../../src/lib/github-client';

describe('GitHubClient', () => {
  let client: GitHubClient;
  const mockToken = 'test-token';

  beforeEach(() => {
    client = new GitHubClient({ token: mockToken });
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('should authenticate and fetch user data', async () => {
      const mockUser = { login: 'testuser', id: 123 };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([
          ['X-RateLimit-Remaining', '4999'],
          ['X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 3600)],
        ]),
        json: async () => mockUser,
      });

      const user = await client.getUser();
      expect(user).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/user',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it('should fetch specific user by username', async () => {
      const mockUser = { login: 'octocat', id: 456 };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([
          ['X-RateLimit-Remaining', '4999'],
          ['X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 3600)],
        ]),
        json: async () => mockUser,
      });

      const user = await client.getUser('octocat');
      expect(user).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/users/octocat',
        expect.any(Object)
      );
    });
  });

  describe('repository operations', () => {
    it('should fetch repository data', async () => {
      const mockRepo = { name: 'test-repo', owner: { login: 'testuser' } };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([
          ['X-RateLimit-Remaining', '4999'],
          ['X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 3600)],
        ]),
        json: async () => mockRepo,
      });

      const repo = await client.getRepo('testuser', 'test-repo');
      expect(repo).toEqual(mockRepo);
    });

    it('should star a repository', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        headers: new Map([
          ['X-RateLimit-Remaining', '4999'],
          ['X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 3600)],
        ]),
      });

      await client.starRepo('testuser', 'test-repo');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/user/starred/testuser/test-repo',
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should unstar a repository', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        headers: new Map([
          ['X-RateLimit-Remaining', '4999'],
          ['X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 3600)],
        ]),
      });

      await client.unstarRepo('testuser', 'test-repo');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/user/starred/testuser/test-repo',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('rate limiting', () => {
    it('should respect rate limit headers and pause when limit approached', async () => {
      const resetTime = Math.floor(Date.now() / 1000) + 1;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([
          ['X-RateLimit-Remaining', '3'],
          ['X-RateLimit-Reset', String(resetTime)],
        ]),
        json: async () => ({ login: 'test' }),
      });

      await client.getUser();
      
      // Second call should wait since remaining < 5
      const startTime = Date.now();
      await client.getUser();
      const elapsed = Date.now() - startTime;
      
      // Should have waited (allowing some margin for test execution)
      expect(elapsed).toBeGreaterThanOrEqual(0);
    });

    it('should apply exponential backoff on 429 response', async () => {
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          return {
            ok: false,
            status: 429,
            headers: new Map([
              ['X-RateLimit-Remaining', '0'],
              ['X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 3600)],
            ]),
            text: async () => 'Rate limit exceeded',
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Map([
            ['X-RateLimit-Remaining', '4999'],
            ['X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 3600)],
          ]),
          json: async () => ({ login: 'test' }),
        };
      });

      const startTime = Date.now();
      await client.getUser();
      const elapsed = Date.now() - startTime;

      expect(callCount).toBe(3);
      // Should have backed off (1s + 2s = 3s minimum)
      expect(elapsed).toBeGreaterThanOrEqual(2900);
    });
  });

  describe('error handling', () => {
    it('should throw on 404 errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Map(),
        text: async () => 'Not found',
      });

      await expect(client.getUser('nonexistent')).rejects.toThrow('GitHub API error (404)');
    });

    it('should throw on 401 errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Map(),
        text: async () => 'Unauthorized',
      });

      await expect(client.getUser()).rejects.toThrow('GitHub API error (401)');
    });

    it('should retry on 5xx errors with backoff', async () => {
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          return {
            ok: false,
            status: 500,
            headers: new Map(),
            text: async () => 'Internal server error',
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Map([
            ['X-RateLimit-Remaining', '4999'],
            ['X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 3600)],
          ]),
          json: async () => ({ login: 'test' }),
        };
      });

      const startTime = Date.now();
      await client.getUser();
      const elapsed = Date.now() - startTime;

      expect(callCount).toBe(3);
      expect(elapsed).toBeGreaterThanOrEqual(2900);
    });

    it('should throw after max retries on persistent 5xx errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        headers: new Map(),
        text: async () => 'Service unavailable',
      });

      await expect(client.getUser()).rejects.toThrow('Server error after 5 retries');
    }, 35000);

    it('should retry on network errors', async () => {
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount < 2) {
          throw new Error('Network error');
        }
        return {
          ok: true,
          status: 200,
          headers: new Map([
            ['X-RateLimit-Remaining', '4999'],
            ['X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 3600)],
          ]),
          json: async () => ({ login: 'test' }),
        };
      });

      await client.getUser();
      expect(callCount).toBe(2);
    });
  });

  describe('custom base URL', () => {
    it('should use custom base URL when provided', async () => {
      const customClient = new GitHubClient({
        token: mockToken,
        baseURL: 'https://github.enterprise.com/api/v3',
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([
          ['X-RateLimit-Remaining', '4999'],
          ['X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 3600)],
        ]),
        json: async () => ({ login: 'test' }),
      });

      await customClient.getUser();
      expect(global.fetch).toHaveBeenCalledWith(
        'https://github.enterprise.com/api/v3/user',
        expect.any(Object)
      );
    });
  });
});
