import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticate } from '../../src/api/middleware/auth';
import { validate, rules } from '../../src/api/middleware/validate';
import { Request, Response } from '../../src/api/types';

vi.mock('../../src/auth/session');

describe('Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonSpy: ReturnType<typeof vi.fn>;
  let errorSpy: ReturnType<typeof vi.fn>;
  let nextSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonSpy = vi.fn();
    errorSpy = vi.fn();
    nextSpy = vi.fn();
    mockReq = { headers: {} };
    mockRes = { json: jsonSpy, error: errorSpy };
  });

  describe('authenticate', () => {
    it('should return 401 when no authorization header', () => {
      authenticate(mockReq as Request, mockRes as Response, nextSpy);

      expect(errorSpy).toHaveBeenCalledWith('Unauthorized', 401);
      expect(nextSpy).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is malformed', () => {
      mockReq.headers = { authorization: 'InvalidFormat' };

      authenticate(mockReq as Request, mockRes as Response, nextSpy);

      expect(errorSpy).toHaveBeenCalledWith('Unauthorized', 401);
      expect(nextSpy).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', async () => {
      const { verifySession } = await import('../../src/auth/session');
      vi.mocked(verifySession).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      mockReq.headers = { authorization: 'Bearer invalid-token' };

      authenticate(mockReq as Request, mockRes as Response, nextSpy);

      expect(errorSpy).toHaveBeenCalledWith('Invalid or expired token', 401);
      expect(nextSpy).not.toHaveBeenCalled();
    });

    it('should call next when token is valid', async () => {
      const { verifySession } = await import('../../src/auth/session');
      vi.mocked(verifySession).mockReturnValue({
        userId: 1,
        githubId: '123',
        githubUsername: 'testuser',
      });

      mockReq.headers = { authorization: 'Bearer valid-token' };

      authenticate(mockReq as Request, mockRes as Response, nextSpy);

      expect(nextSpy).toHaveBeenCalled();
      expect(mockReq.user).toEqual({
        userId: 1,
        githubId: '123',
        githubUsername: 'testuser',
      });
    });
  });

  describe('validate', () => {
    it('should return 400 when validation fails', () => {
      mockReq.body = { field: '' };
      const middleware = validate({ field: rules.required });

      middleware(mockReq as Request, mockRes as Response, nextSpy);

      expect(jsonSpy).toHaveBeenCalledWith(
        { error: 'Validation failed', errors: { field: 'This field is required' } },
        400
      );
      expect(nextSpy).not.toHaveBeenCalled();
    });

    it('should call next when validation passes', () => {
      mockReq.body = { field: 'value' };
      const middleware = validate({ field: rules.required });

      middleware(mockReq as Request, mockRes as Response, nextSpy);

      expect(nextSpy).toHaveBeenCalled();
    });
  });

  describe('validation rules', () => {
    it('should validate required fields', () => {
      expect(rules.required('')).toBe('This field is required');
      expect(rules.required('value')).toBeNull();
    });

    it('should validate GitHub repo URLs', () => {
      expect(rules.githubRepo('https://github.com/owner/repo')).toBeNull();
      expect(rules.githubRepo('https://gitlab.com/owner/repo')).toBe(
        'Must be a valid GitHub repository URL'
      );
      expect(rules.githubRepo('not-a-url')).toBe('Must be a valid GitHub repository URL');
    });
  });
});
