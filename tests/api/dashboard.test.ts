import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDashboard } from '../../src/api/routes/dashboard.js';
import { db } from '../../src/config/database.js';

vi.mock('../../src/config/database.js', () => ({
  db: {
    select: vi.fn(),
  },
}));

describe('Dashboard API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns dashboard data for authenticated user', async () => {
    const mockRepos = [
      { id: 1, repoName: 'test-repo', repoUrl: 'https://github.com/user/test-repo', starsCount: 10 },
    ];
    const mockRequests = [
      { id: 1, repositoryId: 1, status: 'pending', createdAt: new Date() },
    ];

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(mockRepos),
      }),
    });

    const req = {
      user: { userId: 1 },
    } as any;

    const res = {
      json: vi.fn(),
      error: vi.fn(),
    } as any;

    await getDashboard(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        repositories: expect.any(Array),
        requests: expect.any(Array),
        matches: expect.any(Array),
      })
    );
  });

  it('handles database errors', async () => {
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockRejectedValue(new Error('DB error')),
      }),
    });

    const req = {
      user: { userId: 1 },
    } as any;

    const res = {
      json: vi.fn(),
      error: vi.fn(),
    } as any;

    await getDashboard(req, res);

    expect(res.error).toHaveBeenCalledWith('Failed to retrieve dashboard data', 500);
  });
});
