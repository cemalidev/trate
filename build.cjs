const esbuild = require('esbuild');
const fs = require('fs');

async function build() {
  await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: 'dist/index.js',
    external: ['commander', 'conf', 'node-fetch', 'figlet', 'inquirer'],
    format: 'esm',
    sourcemap: false,
    minify: false,
    banner: {
      js: '#!/usr/bin/env node',
    },
  });

  fs.chmodSync('dist/index.js', '755');
  console.log('Build complete!');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
