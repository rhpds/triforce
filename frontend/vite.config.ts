/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/healthcare': {
        target: 'http://localhost:8081',
        rewrite: (path) => path.replace(/^\/healthcare/, ''),
      },
      '/finserv': {
        target: 'http://localhost:8082',
        rewrite: (path) => path.replace(/^\/finserv/, ''),
      },
      '/orchestrator': {
        target: 'http://localhost:8083',
        rewrite: (path) => path.replace(/^\/orchestrator/, ''),
      },
      '/mcp': {
        target: 'http://localhost:8091',
        rewrite: (path) => path.replace(/^\/mcp/, ''),
      },
      '/router': {
        target: 'http://localhost:8094',
        rewrite: (path) => path.replace(/^\/router/, ''),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
})
