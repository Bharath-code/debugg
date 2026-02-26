import { defineConfig } from 'tsup';

export default defineConfig((options) => [
  // Main library build
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
    minify: false,
    target: 'es2020',
    outDir: 'dist',
    external: ['@sentry/node', '@sentry/browser'],
    banner: {
      js: '"use strict";',
    },
    esbuildOptions: (options) => {
      options.legalComments = 'inline';
    },
    // Bundle analysis
    metafile: true,
    onSuccess: options.watch ? undefined : 'bun run build:analyze',
  },
]);
