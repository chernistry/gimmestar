import { describe, it, expect } from 'vitest';
import { RandomMatcher, type User } from './RandomMatcher.js';

describe('RandomMatcher', () => {
  const matcher = new RandomMatcher();

  describe('edge cases', () => {
    it('should handle empty list', () => {
      const result = matcher.match([], 12345);
      expect(result).toEqual([]);
    });

    it('should handle single user', () => {
      const users: User[] = [
        { id: 'user1', repositories: ['https://github.com/user1/repo1'] },
      ];
      const result = matcher.match(users, 12345);
      expect(result).toEqual([]);
    });

    it('should handle two users', () => {
      const users: User[] = [
        { id: 'user1', repositories: ['https://github.com/user1/repo1'] },
        { id: 'user2', repositories: ['https://github.com/user2/repo2'] },
      ];
      const result = matcher.match(users, 12345);
      expect(result).toHaveLength(2);
    });

    it('should skip users with no repositories', () => {
      const users: User[] = [
        { id: 'user1', repositories: ['https://github.com/user1/repo1'] },
        { id: 'user2', repositories: [] },
        { id: 'user3', repositories: ['https://github.com/user3/repo3'] },
      ];
      const result = matcher.match(users, 12345);
      expect(result.length).toBeLessThanOrEqual(3);
      expect(result.every((m) => m.repositoryUrl)).toBe(true);
    });
  });

  describe('non-reciprocal property', () => {
    it('should not create reciprocal pairs in same cycle', () => {
      const users: User[] = [
        { id: 'user1', repositories: ['https://github.com/user1/repo1'] },
        { id: 'user2', repositories: ['https://github.com/user2/repo2'] },
        { id: 'user3', repositories: ['https://github.com/user3/repo3'] },
        { id: 'user4', repositories: ['https://github.com/user4/repo4'] },
      ];

      const matches = matcher.match(users, 12345);
      const reciprocalPairs = new Set<string>();

      for (const match of matches) {
        const pair = [match.giverId, match.receiverId].sort().join('-');
        const reverse = matches.find(
          (m) => m.giverId === match.receiverId && m.receiverId === match.giverId
        );

        if (reverse) {
          reciprocalPairs.add(pair);
        }
      }

      expect(reciprocalPairs.size).toBe(0);
    });

    it('should not create reciprocal pairs with larger pool', () => {
      const users: User[] = Array.from({ length: 20 }, (_, i) => ({
        id: `user${i}`,
        repositories: [`https://github.com/user${i}/repo${i}`],
      }));

      const matches = matcher.match(users, 54321);

      for (const match of matches) {
        const reverse = matches.find(
          (m) => m.giverId === match.receiverId && m.receiverId === match.giverId
        );
        expect(reverse).toBeUndefined();
      }
    });
  });

  describe('determinism', () => {
    it('should produce deterministic results with same seed', () => {
      const users: User[] = [
        { id: 'user1', repositories: ['https://github.com/user1/repo1'] },
        { id: 'user2', repositories: ['https://github.com/user2/repo2'] },
        { id: 'user3', repositories: ['https://github.com/user3/repo3'] },
      ];

      const result1 = matcher.match(users, 99999);
      const result2 = matcher.match(users, 99999);

      expect(result1).toEqual(result2);
    });

    it('should produce different results with different seeds', () => {
      const users: User[] = Array.from({ length: 10 }, (_, i) => ({
        id: `user${i}`,
        repositories: [`https://github.com/user${i}/repo${i}`],
      }));

      const result1 = matcher.match(users, 11111);
      const result2 = matcher.match(users, 22222);

      expect(result1).not.toEqual(result2);
    });
  });

  describe('distribution', () => {
    it('should distribute matches evenly across pool', () => {
      const users: User[] = Array.from({ length: 10 }, (_, i) => ({
        id: `user${i}`,
        repositories: [`https://github.com/user${i}/repo${i}`],
      }));

      const matches = matcher.match(users, 77777);

      expect(matches).toHaveLength(10);

      const giverCounts = new Map<string, number>();
      const receiverCounts = new Map<string, number>();

      for (const match of matches) {
        giverCounts.set(match.giverId, (giverCounts.get(match.giverId) || 0) + 1);
        receiverCounts.set(match.receiverId, (receiverCounts.get(match.receiverId) || 0) + 1);
      }

      expect(giverCounts.size).toBe(10);
      expect(receiverCounts.size).toBe(10);
      expect(Array.from(giverCounts.values()).every((c) => c === 1)).toBe(true);
    });
  });
});
