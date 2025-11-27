import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createDatabaseConnection } from '../../src/config/database';
import { validateEnvironment } from '../../src/config/env';

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

describe('Environment Validation', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should pass validation with all required variables', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64');
    process.env.GITHUB_CLIENT_ID = 'test_client_id';
    process.env.GITHUB_CLIENT_SECRET = 'test_client_secret';
    process.env.SESSION_SECRET = Buffer.from('b'.repeat(32)).toString('base64');

    expect(() => validateEnvironment()).not.toThrow();
  });

  it('should throw error when required variables are missing', () => {
    delete process.env.DATABASE_URL;
    delete process.env.ENCRYPTION_KEY;

    expect(() => validateEnvironment()).toThrow(/Missing required environment variables/);
  });

  it('should throw error when ENCRYPTION_KEY is invalid', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.ENCRYPTION_KEY = 'invalid_key';
    process.env.GITHUB_CLIENT_ID = 'test_client_id';
    process.env.GITHUB_CLIENT_SECRET = 'test_client_secret';
    process.env.SESSION_SECRET = Buffer.from('b'.repeat(32)).toString('base64');

    expect(() => validateEnvironment()).toThrow(/ENCRYPTION_KEY must be/);
  });

  it('should throw error when SESSION_SECRET is too short', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64');
    process.env.GITHUB_CLIENT_ID = 'test_client_id';
    process.env.GITHUB_CLIENT_SECRET = 'test_client_secret';
    process.env.SESSION_SECRET = Buffer.from('short').toString('base64');

    expect(() => validateEnvironment()).toThrow(/SESSION_SECRET must be at least 32 bytes/);
  });
});
