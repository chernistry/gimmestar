import { describe, it, expect } from 'vitest';
import { users, repositories, starRequests, matchingQueue, statusEnum } from '../../src/db/schema';

describe('Database Schema', () => {
  describe('users table', () => {
    it('should have correct structure', () => {
      expect(users).toBeDefined();
      expect(users.id).toBeDefined();
      expect(users.githubId).toBeDefined();
      expect(users.githubUsername).toBeDefined();
      expect(users.encryptedToken).toBeDefined();
      expect(users.createdAt).toBeDefined();
      expect(users.updatedAt).toBeDefined();
    });
  });

  describe('repositories table', () => {
    it('should have correct structure', () => {
      expect(repositories).toBeDefined();
      expect(repositories.id).toBeDefined();
      expect(repositories.userId).toBeDefined();
      expect(repositories.githubRepoId).toBeDefined();
      expect(repositories.repoName).toBeDefined();
      expect(repositories.repoUrl).toBeDefined();
      expect(repositories.starsCount).toBeDefined();
      expect(repositories.createdAt).toBeDefined();
      expect(repositories.updatedAt).toBeDefined();
    });
  });

  describe('starRequests table', () => {
    it('should have correct structure', () => {
      expect(starRequests).toBeDefined();
      expect(starRequests.id).toBeDefined();
      expect(starRequests.userId).toBeDefined();
      expect(starRequests.repositoryId).toBeDefined();
      expect(starRequests.status).toBeDefined();
      expect(starRequests.createdAt).toBeDefined();
      expect(starRequests.updatedAt).toBeDefined();
    });
  });

  describe('matchingQueue table', () => {
    it('should have correct structure', () => {
      expect(matchingQueue).toBeDefined();
      expect(matchingQueue.id).toBeDefined();
      expect(matchingQueue.requestId).toBeDefined();
      expect(matchingQueue.matchedWithRequestId).toBeDefined();
      expect(matchingQueue.priorityScore).toBeDefined();
      expect(matchingQueue.matchedAt).toBeDefined();
      expect(matchingQueue.createdAt).toBeDefined();
    });
  });

  describe('status enum', () => {
    it('should have correct values', () => {
      expect(statusEnum).toBeDefined();
      expect(statusEnum.enumName).toBe('status');
      expect(statusEnum.enumValues).toEqual(['pending', 'matched', 'completed', 'failed']);
    });
  });
});
