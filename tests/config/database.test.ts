import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createDatabaseConnection } from '../../src/config/database';

describe('Database Configuration', () => {
  const originalEnv = process.env.DATABASE_URL;

  afterEach(() => {
    process.env.DATABASE_URL = originalEnv;
  });

  describe('createDatabaseConnection', () => {
    it('should throw error when DATABASE_URL is missing', () => {
      delete process.env.DATABASE_URL;
      expect(() => createDatabaseConnection()).toThrow('DATABASE_URL environment variable is not set');
    });

    it('should create connection with valid DATABASE_URL', () => {
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      const db = createDatabaseConnection();
      expect(db).toBeDefined();
    });
  });
});
