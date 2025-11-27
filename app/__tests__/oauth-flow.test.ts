import { describe, it, expect, beforeEach, vi } from 'vitest';
import './setup';
import { exchangeCodeForToken } from '../utils/github-oauth';

describe('OAuth Flow Integration', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';
  });

  it('should exchange code for token successfully', async () => {
    const mockToken = 'gho_test_token';
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: mockToken }),
    });

    const token = await exchangeCodeForToken('test_code');
    expect(token).toBe(mockToken);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/callback',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'test_code' }),
      })
    );
  });

  it('should throw error on failed token exchange', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    await expect(exchangeCodeForToken('invalid_code')).rejects.toThrow('Failed to exchange code for token');
  });
});
