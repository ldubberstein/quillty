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
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/index.ts',
        'src/**/types.ts',
        // Deferred to post-MVP
        'src/calculations/**',
        'src/pattern-designer/**',
        // Legacy/deprecated files
        'src/block-designer/BlockDesigner.ts',
        // Schemas (Zod) - validation tested implicitly via store tests
        'src/block-designer/schemas.ts',
      ],
      thresholds: {
        // Logic-heavy tier: 90% lines / 90% statements / 85% branches
        // Function threshold lowered to 75% since React selector hooks (useBlock, useSelectedShape, etc.)
        // can't be unit tested without a React environment - they're tested via integration tests
        lines: 90,
        statements: 90,
        branches: 85,
        functions: 75,
      },
    },
  },
});
