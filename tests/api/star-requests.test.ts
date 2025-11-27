import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitStarRequest } from '../../src/api/routes/star-requests.js';
import { Request, Response } from '../../src/api/types.js';

// Mock database and GitHub client
vi.mock('../../src/config/database.js', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([]))
      }))
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 1 }]))
      }))
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve())
      }))
    }))
  }
}));

vi.mock('../../src/lib/github-client.js', () => ({
  GitHubClient: vi.fn().mockImplementation(() => ({
    getRepository: vi.fn(() => Promise.resolve({ stargazers_count: 100 }))
  }))
}));

describe('Star Requests API', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonSpy: ReturnType<typeof vi.fn>;
  let errorSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonSpy = vi.fn();
    errorSpy = vi.fn();
    
    mockReq = {
      body: {},
      user: { userId: 1, token: 'test-token' }
    };
    
    mockRes = {
      json: jsonSpy,
      error: errorSpy
    };
  });

  it('should reject invalid GitHub URL format', async () => {
    mockReq.body = { repoUrl: 'https://gitlab.com/owner/repo' };
    
    await submitStarRequest(mockReq as Request, mockRes as Response);
    
    expect(errorSpy).toHaveBeenCalledWith('Invalid GitHub repository URL format', 400);
  });

  it('should reject URL without https', async () => {
    mockReq.body = { repoUrl: 'http://github.com/owner/repo' };
    
    await submitStarRequest(mockReq as Request, mockRes as Response);
    
    expect(errorSpy).toHaveBeenCalledWith('Invalid GitHub repository URL format', 400);
  });

  it('should reject malformed GitHub URL', async () => {
    mockReq.body = { repoUrl: 'https://github.com/owner' };
    
    await submitStarRequest(mockReq as Request, mockRes as Response);
    
    expect(errorSpy).toHaveBeenCalledWith('Invalid GitHub repository URL format', 400);
  });

  it('should accept valid GitHub URL format', async () => {
    mockReq.body = { repoUrl: 'https://github.com/owner/repo' };
    
    await submitStarRequest(mockReq as Request, mockRes as Response);
    
    // Should not error on URL validation
    expect(errorSpy).not.toHaveBeenCalledWith('Invalid GitHub repository URL format', 400);
  });
});
