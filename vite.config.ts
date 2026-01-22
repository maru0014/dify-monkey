import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import { crx, defineManifest } from '@crxjs/vite-plugin';
// import manifest from './manifest.json';
import { crx, defineManifest } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  build: {
    rollupOptions: {
      input: {
        prompt: 'src/prompt/index.html',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Monaco Editor worker configuration for Chrome Extension
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    include: ['monaco-editor'],
  },
});
