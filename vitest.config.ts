import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node', // pure functions, no DOM needed
    globals: true,
  },
});
