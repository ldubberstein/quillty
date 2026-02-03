import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/**/index.ts', 'src/**/types.ts'],
      thresholds: {
        // Logic-heavy tier: 90% lines / 90% statements / 85% branches
        lines: 90,
        statements: 90,
        branches: 85,
        functions: 85,
      },
    },
  },
});
