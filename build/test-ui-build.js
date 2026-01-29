const esbuild = require('esbuild');
const path = require('path');
const NodeModulesPolyfillPlugin = require('@esbuild-plugins/node-modules-polyfill').NodeModulesPolyfillPlugin;
const { NodeGlobalsPolyfillPlugin } = require('@esbuild-plugins/node-globals-polyfill');
const alias = require('esbuild-plugin-alias');
const svgrDualExport = require('./plugins/svgr-dual-export');

const commonConfig = {
  bundle: true,
  sourcemap: false,
  minify: false,
  target: ['chrome96', 'firefox91'],
  platform: 'browser',
  logLevel: 'info',
  define: {
    'process.env.NODE_ENV': '"development"',
    'process.env.MANIFEST_TYPE': '"chrome-mv3"',
    global: 'globalThis',
  },
  plugins: [
    NodeModulesPolyfillPlugin(),
    NodeGlobalsPolyfillPlugin({
      process: true,
      buffer: true,
    }),
    svgrDualExport(),
    alias({
      '@': path.resolve(__dirname, '../src'),
      '@repo/ui': path.resolve(__dirname, '../src/packages/ui/src/index.tsx'),
      '@repo/utils': path.resolve(__dirname, '../src/packages/utils/src/index.ts'),
      'ui': path.resolve(__dirname, '../src/ui'),
      'background': path.resolve(__dirname, '../src/background'),
      'consts': path.resolve(__dirname, '../src/constant/index.ts'),
      'assets': path.resolve(__dirname, '../src/ui/assets'),
      'changeLogs': path.resolve(__dirname, '../changeLogs'),
      'react-window': path.resolve(__dirname, '../src/utils/react-window-shim.ts'),
      '@debank/common': path.resolve(__dirname, '../node_modules/@debank/common/dist/index.js'),
      'moment': require.resolve('dayjs'),
      '@repo/ui/styles.css': path.resolve(__dirname, '../src/packages/ui/dist/index.css'),
    }),
  ],
  loader: {
    '.png': 'file',
    '.jpg': 'file',
    '.jpeg': 'file',
    '.gif': 'file',
    '.woff': 'file',
    '.woff2': 'file',
    '.ttf': 'file',
    '.eot': 'file',
    '.wasm': 'file',
    '.md': 'text',
    '.css': 'text',
  },
  external: [],
};

async function testUiBuild() {
  try {
    console.log('Testing UI bundle build...\n');
    
    const result = await esbuild.build({
      entryPoints: ['src/ui/index.tsx'],
      outfile: path.join(__dirname, '../dist-esbuild-mv3/ui.js'),
      format: 'esm',
      ...commonConfig,
      metafile: true,
    });
    
    console.log('\n✅ UI build succeeded!');
    console.log('Errors:', result.errors.length);
    console.log('Warnings:', result.warnings.length);
    
  } catch (error) {
    console.error('\n❌ UI build failed!');
    console.error('Error:', error);
    if (error.errors) {
      console.error('\nBuild errors:');
      error.errors.forEach(err => {
        console.error(`  - ${err.text}`);
        if (err.location) {
          console.error(`    at ${err.location.file}:${err.location.line}:${err.location.column}`);
        }
      });
    }
    process.exit(1);
  }
}

testUiBuild();
