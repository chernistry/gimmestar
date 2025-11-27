import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StarExecutionService } from '../../src/services/starExecutor.js';
import { GitHubClient } from '../../src/lib/github-client.js';

vi.mock('../../src/lib/github-client.js');

describe('StarExecutionService', () => {
  let service: StarExecutionService;
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockClient = {
      starRepo: vi.fn(),
      unstarRepo: vi.fn(),
      getUser: vi.fn(),
    };
    vi.mocked(GitHubClient).mockImplementation(() => mockClient);
    service = new StarExecutionService('test-token');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('starRepository', () => {
    it('should successfully star a repository', async () => {
      mockClient.starRepo.mockResolvedValue(undefined);

      const result = await service.starRepository('owner', 'repo');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockClient.starRepo).toHaveBeenCalledWith('owner', 'repo');
      expect(mockClient.starRepo).toHaveBeenCalledTimes(1);
    });

    it('should retry on transient failures', async () => {
      const serverError = new Error('Server error after 5 retries: 503');
      (serverError as any).status = 503;
      
      mockClient.starRepo
        .mockRejectedValueOnce(serverError)
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce(undefined);

      const resultPromise = service.starRepository('owner', 'repo');
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(mockClient.starRepo).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const authError = new Error('GitHub API error (401): Unauthorized');
      (authError as any).status = 401;
      
      mockClient.starRepo.mockRejectedValue(authError);

      const result = await service.starRepository('owner', 'repo');

      expect(result.success).toBe(false);
      expect(result.error).toContain('401');
      expect(result.retryable).toBe(false);
      expect(mockClient.starRepo).toHaveBeenCalledTimes(1);
    });

    it('should handle rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded after 3 retries');
      (rateLimitError as any).status = 429;
      
      mockClient.starRepo.mockRejectedValue(rateLimitError);

      const resultPromise = service.starRepository('owner', 'repo');
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit');
      expect(result.retryable).toBe(true);
      expect(mockClient.starRepo).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    });

    it('should handle 404 not found errors', async () => {
      const notFoundError = new Error('GitHub API error (404): Not Found');
      (notFoundError as any).status = 404;
      
      mockClient.starRepo.mockRejectedValue(notFoundError);

      const result = await service.starRepository('owner', 'repo');

      expect(result.success).toBe(false);
      expect(result.error).toContain('404');
      expect(result.retryable).toBe(false);
      expect(mockClient.starRepo).toHaveBeenCalledTimes(1);
    });
  });

  describe('unstarRepository', () => {
    it('should successfully unstar a repository', async () => {
      mockClient.unstarRepo.mockResolvedValue(undefined);

      const result = await service.unstarRepository('owner', 'repo');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockClient.unstarRepo).toHaveBeenCalledWith('owner', 'repo');
      expect(mockClient.unstarRepo).toHaveBeenCalledTimes(1);
    });

    it('should retry on server errors', async () => {
      const serverError = new Error('Server error after 5 retries: 500');
      (serverError as any).status = 500;
      
      mockClient.unstarRepo
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce(undefined);

      const resultPromise = service.unstarRepository('owner', 'repo');
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(mockClient.unstarRepo).toHaveBeenCalledTimes(2);
    });

    it('should handle authentication failures', async () => {
      const authError = new Error('GitHub API error (403): Forbidden');
      (authError as any).status = 403;
      
      mockClient.unstarRepo.mockRejectedValue(authError);

      const result = await service.unstarRepository('owner', 'repo');

      expect(result.success).toBe(false);
      expect(result.error).toContain('403');
      expect(result.retryable).toBe(false);
    });
  });

  describe('checkRateLimit', () => {
    it('should return rate limit information', async () => {
      mockClient.getUser.mockResolvedValue({ login: 'testuser' });

      const rateLimit = await service.checkRateLimit();

      expect(rateLimit).toHaveProperty('remaining');
      expect(rateLimit).toHaveProperty('reset');
      expect(rateLimit).toHaveProperty('limit');
      expect(typeof rateLimit.remaining).toBe('number');
      expect(typeof rateLimit.reset).toBe('number');
      expect(typeof rateLimit.limit).toBe('number');
    });
  });

  describe('error classification', () => {
    it('should classify 5xx errors as retryable', async () => {
      const errors = [500, 502, 503, 504].map(status => {
        const err = new Error(`Server error: ${status}`);
        (err as any).status = status;
        return err;
      });

      for (const error of errors) {
        mockClient.starRepo.mockRejectedValue(error);
        const resultPromise = service.starRepository('owner', 'repo');
        await vi.runAllTimersAsync();
        const result = await resultPromise;
        expect(result.retryable).toBe(true);
      }
    });

    it('should classify 4xx errors (except 429) as non-retryable', async () => {
      const errors = [400, 401, 403, 404].map(status => {
        const err = new Error(`Client error: ${status}`);
        (err as any).status = status;
        return err;
      });

      for (const error of errors) {
        mockClient.starRepo.mockRejectedValue(error);
        const result = await service.starRepository('owner', 'repo');
        expect(result.retryable).toBe(false);
      }
    });

    it('should classify timeout errors as retryable', async () => {
      const timeoutError = new Error('Request timeout');
      mockClient.starRepo.mockRejectedValue(timeoutError);

      const resultPromise = service.starRepository('owner', 'repo');
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.retryable).toBe(true);
    });
  });
});
