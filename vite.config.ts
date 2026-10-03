/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Keep the export libraries out of the main bundle (they load on first export).
        manualChunks: { jspdf: ['jspdf'], jszip: ['jszip'] },
      },
    },
  },
  preview: { port: 4173 },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
});
