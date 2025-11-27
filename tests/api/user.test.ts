import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock database before imports
vi.mock('../../src/config/database', () => ({
  db: {
    select: vi.fn(),
  },
}));

import { getProfile } from '../../src/api/routes/user';
import { Request, Response } from '../../src/api/types';
import { db } from '../../src/config/database';

describe('User API', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonSpy: ReturnType<typeof vi.fn>;
  let errorSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    jsonSpy = vi.fn();
    errorSpy = vi.fn();
    mockReq = {
      user: { userId: 1, githubId: '123', githubUsername: 'testuser' },
    };
    mockRes = { json: jsonSpy, error: errorSpy };
  });

  describe('GET /api/user/profile', () => {
    it('should return 404 when user not found', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      await getProfile(mockReq as Request, mockRes as Response);

      expect(errorSpy).toHaveBeenCalledWith('User not found', 404);
    });

    it('should return user profile with stats', async () => {
      const mockUser = {
        id: 1,
        githubUsername: 'testuser',
        createdAt: new Date('2025-01-01'),
      };

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockUser]),
        }),
      } as any);

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ totalRequests: 5 }]),
        }),
      } as any);

      await getProfile(mockReq as Request, mockRes as Response);

      expect(jsonSpy).toHaveBeenCalledWith({
        user: {
          id: mockUser.id,
          username: mockUser.githubUsername,
          memberSince: mockUser.createdAt,
        },
        stats: {
          totalRequests: 5,
        },
      });
    });
  });
});
