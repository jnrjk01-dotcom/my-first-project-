import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2019',
    rollupOptions: {
      output: {
        manualChunks: {
          // Three.js is only needed by the hero depth layer, which is lazy-mounted.
          three: ['three'],
          gsap: ['gsap'],
        },
      },
    },
  },
});
