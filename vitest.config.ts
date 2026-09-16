import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts so the Cloudflare / Start plugins do not
// boot a Worker just to run Node unit tests.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
