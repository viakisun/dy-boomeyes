import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { include: ['src/**/*.test.ts'], globals: true, setupFiles: ['./src/test-setup.ts'] },
});
