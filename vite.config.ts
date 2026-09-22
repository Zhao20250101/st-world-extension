import path from 'node:path';
import { defineConfig } from 'vite';

// Build outside the SillyTavern public/ tree. The browser loads the bundle from
//  /scripts/extensions/third-party/<name>/dist/index.js  (5 levels below public/).
// ST_IMPORT_DEPTH overrides the depth when building anywhere else.
const relative_sillytavern_path = process.env.ST_IMPORT_DEPTH
  ? '../'.repeat(Number(process.env.ST_IMPORT_DEPTH)).slice(0, -1)
  : path.relative(path.join(__dirname, 'dist'), __dirname.substring(0, __dirname.lastIndexOf('public') + 6));

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [
    // Resolve SillyTavern internal modules to relative paths against the public/ root,
    // emitted as external imports (resolved at runtime inside the running client).
    {
      name: 'sillytavern_resolver',
      enforce: 'pre',
      resolveId(id) {
        if (id.startsWith('@sillytavern/')) {
          return {
            id: path.join(relative_sillytavern_path, id.replace('@sillytavern/', '')).replaceAll('\\', '/') + '.js',
            external: true,
          };
        }
      },
    },
  ],
  build: {
    rollupOptions: {
      input: 'src/index.ts',
      preserveEntrySignatures: 'strict',
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
    outDir: 'dist',
    emptyOutDir: false,
    minify: mode === 'production' ? true : false,
    sourcemap: mode === 'production' ? true : 'inline',
    target: 'esnext',
  },
}));
