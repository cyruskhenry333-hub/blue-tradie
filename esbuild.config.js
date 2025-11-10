import * as esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Plugin to resolve TypeScript path aliases
const aliasPlugin = {
  name: 'alias',
  setup(build) {
    // Resolve @db to server/db.ts
    build.onResolve({ filter: /^@db$/ }, () => ({
      path: path.resolve(__dirname, 'server', 'db.ts'),
    }));

    // Resolve @shared/* to shared/*.ts
    build.onResolve({ filter: /^@shared\// }, (args) => {
      const subpath = args.path.replace('@shared/', '');
      return {
        path: path.resolve(__dirname, 'shared', `${subpath}.ts`),
      };
    });
  },
};

const buildOptions = {
  platform: 'node',
  bundle: true,
  format: 'esm',
  outdir: 'dist',
  plugins: [aliasPlugin],
  packages: 'external', // Mark all node_modules as external
};

// Build server
await esbuild.build({
  ...buildOptions,
  entryPoints: ['server/index.ts'],
});

// Build worker
await esbuild.build({
  ...buildOptions,
  entryPoints: ['server/worker.ts'],
});

console.log('✅ Server and worker built successfully');
