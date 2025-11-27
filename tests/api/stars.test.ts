import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock database before imports
vi.mock('../../src/config/database', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
  },
}));

import { createStarRequest, getMatches } from '../../src/api/routes/stars';
import { Request, Response } from '../../src/api/types';
import { db } from '../../src/config/database';

describe('Stars API', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonSpy: ReturnType<typeof vi.fn>;
  let errorSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    jsonSpy = vi.fn();
    errorSpy = vi.fn();
    mockReq = {
      body: {},
      user: { userId: 1, githubId: '123', githubUsername: 'testuser' },
    };
    mockRes = { json: jsonSpy, error: errorSpy };
  });

  describe('POST /api/stars/request', () => {
    it('should return 400 for invalid repo URL', async () => {
      mockReq.body = { repoUrl: 'not-a-url' };

      await createStarRequest(mockReq as Request, mockRes as Response);

      expect(errorSpy).toHaveBeenCalledWith('Invalid GitHub repository URL', 400);
    });

    it('should create star request for valid repo URL', async () => {
      const mockRepoReturning = vi.fn().mockResolvedValue([{ id: 1 }]);
      const mockRepoOnConflict = vi.fn().mockReturnValue({ returning: mockRepoReturning });
      const mockRepoValues = vi.fn().mockReturnValue({ onConflictDoNothing: mockRepoOnConflict });
      
      const mockRequestReturning = vi.fn().mockResolvedValue([{ id: 2, status: 'pending' }]);
      const mockRequestValues = vi.fn().mockReturnValue({ returning: mockRequestReturning });

      vi.mocked(db.insert)
        .mockReturnValueOnce({ values: mockRepoValues } as any)
        .mockReturnValueOnce({ values: mockRequestValues } as any);

      const mockWhere = vi.fn().mockResolvedValue([{ id: 1 }]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

      mockReq.body = { repoUrl: 'https://github.com/owner/repo' };

      await createStarRequest(mockReq as Request, mockRes as Response);

      expect(jsonSpy).toHaveBeenCalledWith(
        { requestId: 2, status: 'pending' },
        201
      );
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/stars/matches', () => {
    it('should return matches for authenticated user', async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: 1, userId: 1 }]),
        }),
      } as any);

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      await getMatches(mockReq as Request, mockRes as Response);

      expect(jsonSpy).toHaveBeenCalledWith({ matches: expect.any(Array) });
    });
  });
});
