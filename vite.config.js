import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'Img sources',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: '/Frontend/html/index.html',
        landing: '/Frontend/html/landing.html',
        hobby: '/Frontend/html/hobby_selection.html'
      }
    }
  },
  server: {
    port: 5173,
    open: '/Frontend/html/landing.html'
  }
});
