import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '../dashboard/page';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'testuser' },
    token: 'test-token',
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

global.fetch = vi.fn();

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {}));
    render(<DashboardPage />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('renders dashboard sections with data', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        repositories: [
          { id: 1, repoName: 'test-repo', repoUrl: 'https://github.com/user/test-repo', starsCount: 10, enrolled: true },
        ],
        requests: [
          { id: 1, repositoryName: 'test-repo', status: 'pending', createdAt: '2025-01-01' },
        ],
        matches: [
          { id: 1, yourRepo: 'test-repo', theirRepo: 'other-repo', matchedAt: '2025-01-01', status: 'completed' },
        ],
      }),
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeDefined();
      expect(screen.getByText('Your Repositories')).toBeDefined();
      expect(screen.getByText('Star Requests')).toBeDefined();
      expect(screen.getByText('Match History')).toBeDefined();
    });
  });

  it('renders empty states when no data', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        repositories: [],
        requests: [],
        matches: [],
      }),
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('No repositories enrolled yet.')).toBeDefined();
      expect(screen.getByText('No star requests yet.')).toBeDefined();
      expect(screen.getByText('No matches yet.')).toBeDefined();
    });
  });

  it('handles fetch error', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeDefined();
    });
  });
});
