import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Build = LIBRARY (kontrak §3B.4 invarian isolasi):
// - paket terpisah, dependensi berat TIDAK masuk bundle legacy
// - 1 file ES + CSS di-inline ke Shadow DOM (lihat src/mount.tsx)
// - app legacy lazy-import dist/exam-sim.js saat masuk station (seam+flag)
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: resolve(__dirname, 'src/mount.tsx'),
      formats: ['es'],
      fileName: () => 'exam-sim.js',
    },
  },
});
