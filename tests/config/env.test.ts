import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateEnvironment } from '../../src/config/env';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should pass with all required environment variables', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64');
    process.env.GITHUB_CLIENT_ID = 'test_client_id';
    process.env.GITHUB_CLIENT_SECRET = 'test_client_secret';
    process.env.SESSION_SECRET = Buffer.from('b'.repeat(32)).toString('base64');

    expect(() => validateEnvironment()).not.toThrow();
  });

  it('should throw error when DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL;
    process.env.ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64');
    process.env.GITHUB_CLIENT_ID = 'test_client_id';
    process.env.GITHUB_CLIENT_SECRET = 'test_client_secret';
    process.env.SESSION_SECRET = Buffer.from('b'.repeat(32)).toString('base64');

    expect(() => validateEnvironment()).toThrow('Missing required environment variables: DATABASE_URL');
  });

  it('should throw error when ENCRYPTION_KEY is missing', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    delete process.env.ENCRYPTION_KEY;
    process.env.GITHUB_CLIENT_ID = 'test_client_id';
    process.env.GITHUB_CLIENT_SECRET = 'test_client_secret';
    process.env.SESSION_SECRET = Buffer.from('b'.repeat(32)).toString('base64');

    expect(() => validateEnvironment()).toThrow('Missing required environment variables: ENCRYPTION_KEY');
  });

  it('should throw error when multiple variables are missing', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    delete process.env.ENCRYPTION_KEY;
    delete process.env.GITHUB_CLIENT_ID;
    process.env.GITHUB_CLIENT_SECRET = 'test_client_secret';
    process.env.SESSION_SECRET = Buffer.from('b'.repeat(32)).toString('base64');

    expect(() => validateEnvironment()).toThrow('Missing required environment variables: ENCRYPTION_KEY, GITHUB_CLIENT_ID');
  });

  it('should throw error when ENCRYPTION_KEY is not 32 bytes', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.ENCRYPTION_KEY = Buffer.from('short').toString('base64');
    process.env.GITHUB_CLIENT_ID = 'test_client_id';
    process.env.GITHUB_CLIENT_SECRET = 'test_client_secret';
    process.env.SESSION_SECRET = Buffer.from('b'.repeat(32)).toString('base64');

    expect(() => validateEnvironment()).toThrow('ENCRYPTION_KEY must be 32 bytes when base64 decoded');
  });

  it('should throw error when ENCRYPTION_KEY is not valid base64', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.ENCRYPTION_KEY = 'not-valid-base64!!!';
    process.env.GITHUB_CLIENT_ID = 'test_client_id';
    process.env.GITHUB_CLIENT_SECRET = 'test_client_secret';
    process.env.SESSION_SECRET = Buffer.from('b'.repeat(32)).toString('base64');

    expect(() => validateEnvironment()).toThrow('ENCRYPTION_KEY must be 32 bytes when base64 decoded');
  });

  it('should throw error when SESSION_SECRET is less than 32 bytes', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64');
    process.env.GITHUB_CLIENT_ID = 'test_client_id';
    process.env.GITHUB_CLIENT_SECRET = 'test_client_secret';
    process.env.SESSION_SECRET = Buffer.from('short').toString('base64');

    expect(() => validateEnvironment()).toThrow('SESSION_SECRET must be at least 32 bytes when base64 decoded');
  });

  it('should throw error when SESSION_SECRET is not valid base64', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64');
    process.env.GITHUB_CLIENT_ID = 'test_client_id';
    process.env.GITHUB_CLIENT_SECRET = 'test_client_secret';
    process.env.SESSION_SECRET = 'not-valid-base64!!!';

    expect(() => validateEnvironment()).toThrow('SESSION_SECRET must be at least 32 bytes when base64 decoded');
  });

  it('should accept SESSION_SECRET longer than 32 bytes', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64');
    process.env.GITHUB_CLIENT_ID = 'test_client_id';
    process.env.GITHUB_CLIENT_SECRET = 'test_client_secret';
    process.env.SESSION_SECRET = Buffer.from('b'.repeat(64)).toString('base64');

    expect(() => validateEnvironment()).not.toThrow();
  });
});
