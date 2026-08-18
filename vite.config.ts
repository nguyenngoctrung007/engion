import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';
import { config as dotenvConfig } from 'dotenv';

// Load .env into process.env so vite.config.ts can access GOOGLE_CLIENT_ID etc.
dotenvConfig();

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main-process entry point of the Electron App.
        entry: 'electron/main.ts',
        vite: {
          define: {
            'process.env.GOOGLE_CLIENT_ID':     JSON.stringify(process.env.GOOGLE_CLIENT_ID     ?? ''),
            'process.env.GOOGLE_CLIENT_SECRET': JSON.stringify(process.env.GOOGLE_CLIENT_SECRET ?? ''),
          },
          build: {
            outDir: 'dist-electron',
            emptyOutDir: false,
            rollupOptions: {
              external: ['electron']
            }
          }
        }
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          // Notify the Renderer-process to reload the page when the Preload-script builds complete.
          options.reload();
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            emptyOutDir: false,
            rollupOptions: {
              external: ['electron']
            }
          },
          plugins: [
            {
              // Electron loads preload scripts via require(), not import. vite-plugin-electron
              // defaults build.lib.formats to ['es'] whenever package.json has "type": "module",
              // and merging a ['cjs'] override in only concatenates to ['es','cjs'] (Vite's
              // mergeConfig always concatenates arrays), which built BOTH formats to the same
              // output path and corrupted the file. Mutate the resolved config directly instead
              // so only 'cjs' is ever built.
              name: 'force-preload-cjs',
              config(config) {
                if (config.build?.lib) {
                  config.build.lib.formats = ['cjs'];
                }
              }
            }
          ]
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});
