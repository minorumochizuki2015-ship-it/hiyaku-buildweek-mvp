import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
  test: {
    environment: 'node',
    exclude: [...configDefaults.exclude, '**/.claude/**'],
  },
})
