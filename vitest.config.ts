import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./app/__tests__/setup.ts', './tests/e2e/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'tests/', '.next/']
    },
    include: ['tests/**/*.test.ts', 'app/**/*.test.{ts,tsx}'],
  }
});
