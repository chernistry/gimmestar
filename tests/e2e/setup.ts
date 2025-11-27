import { beforeAll } from 'vitest';
import dotenv from 'dotenv';

beforeAll(() => {
  dotenv.config();
  
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL not set. E2E tests require a test database.');
    console.warn('   Set DATABASE_URL in .env or skip E2E tests.');
  }
});
