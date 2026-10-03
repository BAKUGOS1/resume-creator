/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Connect, type Plugin } from 'vite';

/** "/" is the static landing page (index.html); the React app (app.html) owns /resumes and /resume/:id. */
const APP_ROUTE = /^\/(resumes\/?|resume\/[^/?#]+\/?)(\?.*)?$/;
const rewriteAppRoutes: Connect.NextHandleFunction = (req, _res, next) => {
  if (req.url && APP_ROUTE.test(req.url)) req.url = '/app.html';
  next();
};
const appRoutes = (): Plugin => ({
  name: 'app-routes',
  configureServer: (server) => void server.middlewares.use(rewriteAppRoutes),
  configurePreviewServer: (server) => void server.middlewares.use(rewriteAppRoutes),
});

export default defineConfig({
  plugins: [react(), tailwindcss(), appRoutes()],
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        app: fileURLToPath(new URL('./app.html', import.meta.url)),
      },
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
