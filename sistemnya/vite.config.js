import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = __dirname;
const GENERATOR = resolve(ROOT, 'build/bundle-legacy.mjs');

// Re-generates src/main.jsx from the untouched legacy source files.
// Runs before Vite reads the entry (build + dev), and again whenever a
// legacy source file changes during `vite dev`.
function legacyBundlerPlugin() {
  const regenerate = () => execFileSync(process.execPath, [GENERATOR], { stdio: 'inherit' });
  return {
    name: 'ophtha-legacy-bundler',
    buildStart() {
      regenerate();
    },
    configureServer(server) {
      const watched = [
        '*.js',
        '*.jsx',
        'stations/*.jsx',
        'Virtual Patient Simulator.html',
      ].map((p) => resolve(ROOT, p));
      server.watcher.add(watched);
      server.watcher.on('change', (file) => {
        if (file.endsWith('src/main.jsx')) return; // ignore the generated artifact
        if (/\.(jsx?|html)$/.test(file) && !file.includes('/src/') && !file.includes('\\src\\')) {
          try {
            regenerate();
            server.ws.send({ type: 'full-reload' });
          } catch (e) {
            server.config.logger.error('[ophtha-legacy-bundler] ' + e.message);
          }
        }
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [legacyBundlerPlugin(), react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
  },
});
