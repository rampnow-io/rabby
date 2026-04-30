#!/usr/bin/env node

/**
 * ESBuild Watch Script - Ultra-fast incremental builds
 *
 * Refactored to match Webpack architecture:
 * - CSS injection into bundles (like style-loader)
 * - Proper HTML generation with dynamic script/css injection
 * - SVG-to-React transformation
 * - Node.js polyfills
 * - Path aliases matching tsconfig
 *
 * Usage:
 *   yarn dev:esbuild         # MV3 watch
 *   yarn dev:esbuild:mv2     # MV2 watch
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');
const alias = require('esbuild-plugin-alias');
const {
  NodeGlobalsPolyfillPlugin,
} = require('@esbuild-plugins/node-globals-polyfill');
const {
  NodeModulesPolyfillPlugin,
} = require('@esbuild-plugins/node-modules-polyfill');
const svgrDualExport = require('./plugins/svgr-dual-export');
const postCssPlugin = require('esbuild-postcss');

const MANIFEST_TYPE = process.env.MANIFEST_TYPE || 'chrome-mv3';
const IS_MANIFEST_MV3 = MANIFEST_TYPE.includes('-mv3');
const DIST_DIR = IS_MANIFEST_MV3 ? 'dist-esbuild-mv3' : 'dist-esbuild-mv2';

console.log(`\n${'='.repeat(60)}`);
console.log(`🚀 Rabby Extension Development Build (ESBuild)`);
console.log(`Manifest Type: ${MANIFEST_TYPE}`);
console.log(`Output: ${DIST_DIR}`);
console.log(`${'='.repeat(60)}\n`);

// ============================================
// UTILITY FUNCTIONS
// ============================================

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const files = fs.readdirSync(src);
  files.forEach((file) => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

function clearDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// ============================================
// SETUP PHASE - Copy static assets
// ============================================

console.log('[Build] Cleaning previous build...');
clearDir(DIST_DIR);
fs.mkdirSync(DIST_DIR, { recursive: true });

// Copy _raw directory (static assets, locales, fonts, vendor)
if (fs.existsSync('_raw')) {
  copyDir('_raw', DIST_DIR);
  console.log('[Build] ✓ Copied _raw directory');
}

// Copy manifest
const manifestPath = `src/manifest/${MANIFEST_TYPE}/manifest.json`;
if (fs.existsSync(manifestPath)) {
  fs.copyFileSync(manifestPath, path.join(DIST_DIR, 'manifest.json'));
  console.log(`[Build] ✓ Copied manifest: ${MANIFEST_TYPE}`);
}

// Copy Trezor vendor files
const trezorDir = path.join(DIST_DIR, 'vendor', 'trezor');
fs.mkdirSync(trezorDir, { recursive: true });

try {
  if (IS_MANIFEST_MV3) {
    const trezorContentScript = require.resolve(
      '@trezor/connect-webextension/build/content-script.js'
    );
    const trezorConnect = require.resolve(
      '@trezor/connect-webextension/build/trezor-connect-webextension.js'
    );
    fs.copyFileSync(
      trezorContentScript,
      path.join(trezorDir, 'trezor-content-script.js')
    );
    fs.copyFileSync(
      trezorConnect,
      path.join(trezorDir, 'trezor-connect-webextension.js')
    );
  } else {
    const trezorContentScript = require.resolve(
      '@trezor/connect-web/lib/webextension/trezor-content-script.js'
    );
    const trezorUsb = require.resolve(
      '@trezor/connect-web/lib/webextension/trezor-usb-permissions.js'
    );
    fs.copyFileSync(
      trezorContentScript,
      path.join(trezorDir, 'trezor-content-script.js')
    );
    fs.copyFileSync(
      trezorUsb,
      path.join(trezorDir, 'trezor-usb-permissions.js')
    );
  }
  console.log('[Build] ✓ Copied Trezor vendor files');
} catch (error) {
  console.warn('[Build] ⚠ Failed to copy Trezor files:', error.message);
}

// Copy webextension-polyfill
try {
  const polyfillPath = require.resolve(
    'webextension-polyfill/dist/browser-polyfill.js'
  );
  fs.copyFileSync(
    polyfillPath,
    path.join(DIST_DIR, 'webextension-polyfill.js')
  );
  console.log('[Build] ✓ Copied webextension-polyfill.js');
} catch (error) {
  console.warn(
    '[Build] ⚠ Failed to copy webextension-polyfill:',
    error.message
  );
}

// Copy CSS files (like webpack's style-loader would inline these)
try {
  const cssDir = path.join(DIST_DIR, 'css');
  fs.mkdirSync(cssDir, { recursive: true });

  const uiCssPath = 'src/packages/ui/dist/index.css';
  if (fs.existsSync(uiCssPath)) {
    fs.copyFileSync(uiCssPath, path.join(cssDir, 'ui-package.css'));
  }

  const mainCssPath = 'src/ui/style/index.css';
  if (fs.existsSync(mainCssPath)) {
    fs.copyFileSync(mainCssPath, path.join(cssDir, 'main.css'));
  }

  console.log('[Build] ✓ Copied CSS files');
} catch (error) {
  console.warn('[Build] ⚠ Failed to copy CSS files:', error.message);
}

// ============================================
// HTML GENERATION & INJECTION
// ============================================

const htmlFiles = {
  'popup.html': 'src/ui/popup.html',
  'notification.html': 'src/ui/notification.html',
  'index.html': 'src/ui/index.html',
  'desktop.html': 'src/ui/desktop.html',
  'background.html': 'src/background/background.html',
  'offscreen.html': 'src/offscreen/offscreen.html',
};

function injectCssLinks(htmlContent) {
  const cssLinks = [
    '    <link href="/css/ui-package.css" rel="stylesheet" />',
    '    <link href="/css/main.css" rel="stylesheet" />',
  ].join('\n');

  return htmlContent.replace('</head>', `${cssLinks}\n  </head>`);
}

function injectScripts(htmlContent, scriptFiles) {
  // Webpack uses defer, but ESM modules need type="module"
  const scriptTags = scriptFiles
    .map((script) => {
      const isESM = script === 'ui.js' || script === 'offscreen.js';
      const attrs = isESM ? ' type="module"' : ' defer';
      return `<script${attrs} src="/${script}"></script>`;
    })
    .join('');
  return htmlContent.replace('</head>', `${scriptTags}</head>`);
}

console.log('[Build] Copying HTML files...');
for (const [destName, sourcePath] of Object.entries(htmlFiles)) {
  let html = fs.readFileSync(sourcePath, 'utf8');

  // Determine which scripts to inject based on HTML type
  // Webpack injects webextension-polyfill.js in all UI pages
  let scripts = [];
  if (destName === 'background.html') {
    scripts = ['background.js'];
  } else if (destName === 'offscreen.html') {
    scripts = ['webextension-polyfill.js', 'offscreen.js'];
    // Inject CSS for offscreen (generated by esbuild)
    html = html.replace(
      '</head>',
      '    <link href="/offscreen.css" rel="stylesheet" />\n  </head>'
    );
  } else {
    // UI pages: inject webextension-polyfill + ui.js (matching webpack)
    scripts = ['webextension-polyfill.js', 'ui.js'];
    // Inject CSS for UI (generated by esbuild)
    html = html.replace(
      '</head>',
      '    <link href="/ui.css" rel="stylesheet" />\n  </head>'
    );
  }

  // Inject scripts
  html = injectScripts(html, scripts);

  fs.writeFileSync(path.join(DIST_DIR, destName), html);
}
console.log('[Build] ✓ Copied and configured HTML files');

// ============================================
// ESBUILD CONFIGURATION
// ============================================

const commonConfig = {
  bundle: true,
  sourcemap: false,
  minify: false,
  target: ['chrome96', 'firefox91'],
  platform: 'browser',
  logLevel: 'info',
  define: {
    'process.env.NODE_ENV': '"development"',
    'process.env.MANIFEST_TYPE': `"${MANIFEST_TYPE}"`,
    global: 'globalThis',
  },
  plugins: [
    // PostCSS processing (Tailwind CSS compilation)
    postCssPlugin(),
    // Node.js polyfills (matching webpack's ProvidePlugin fallbacks)
    NodeModulesPolyfillPlugin(),
    NodeGlobalsPolyfillPlugin({
      process: true,
      buffer: true,
    }),
    // SVG React Component support with dual export
    svgrDualExport(),
    // Path aliases (matching tsconfig.json paths and webpack aliases)
    alias({
      '@': path.resolve(__dirname, '../src'),
      '@repo/ui': path.resolve(__dirname, '../src/packages/ui/src/index.tsx'),
      '@repo/utils': path.resolve(
        __dirname,
        '../src/packages/utils/src/index.ts'
      ),
      ui: path.resolve(__dirname, '../src/ui'),
      background: path.resolve(__dirname, '../src/background'),
      consts: path.resolve(__dirname, '../src/constant/index.ts'),
      assets: path.resolve(__dirname, '../src/ui/assets'),
      changeLogs: path.resolve(__dirname, '../changeLogs'),
      'react-window': path.resolve(
        __dirname,
        '../src/utils/react-window-shim.ts'
      ),
      '@debank/common': path.resolve(
        __dirname,
        '../node_modules/@debank/common/dist/index.js'
      ),
      // Webpack compatibility aliases
      moment: require.resolve('dayjs'),
      '@repo/ui/styles.css': path.resolve(
        __dirname,
        '../src/packages/ui/dist/index.css'
      ),
    }),
  ],
  loader: {
    '.less': 'empty',
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
    // CSS is handled by PostCSS plugin
  },
  external: [],
};

// Build configurations for each entry point (matching webpack entry points)
const buildConfigs = [
  {
    entryPoints: ['src/background/index.ts'],
    outfile: path.join(DIST_DIR, 'background.js'),
    format: 'iife', // Must use IIFE for service worker (importScripts compatibility)
    ...commonConfig,
  },
  {
    entryPoints: ['src/content-script/index.ts'],
    outfile: path.join(DIST_DIR, 'content-script.js'),
    format: 'iife',
    ...commonConfig,
  },
  {
    entryPoints: ['node_modules/@rabby-wallet/page-provider/dist/index.js'],
    outfile: path.join(DIST_DIR, 'pageProvider.js'),
    format: 'iife',
    ...commonConfig,
  },
  {
    entryPoints: ['src/ui/index.tsx'],
    outfile: path.join(DIST_DIR, 'ui.js'),
    format: 'esm', // Must use ESM for top-level await support
    ...commonConfig,
  },
  {
    entryPoints: ['src/offscreen/scripts/offscreen.ts'],
    outfile: path.join(DIST_DIR, 'offscreen.js'),
    format: 'esm', // Must use ESM for top-level await support
    ...commonConfig,
  },
];

// ============================================
// BUILD EXECUTION
// ============================================

async function buildAll() {
  try {
    console.log('[Build] 🔨 Building all bundles with ESBuild...\n');

    const startTime = Date.now();

    // Build each bundle sequentially to avoid memory issues and see specific errors
    const contexts = [];
    for (const config of buildConfigs) {
      try {
        console.log(`[Build] Building ${path.basename(config.outfile)}...`);
        const context = await esbuild.context(config);
        await context.rebuild();
        contexts.push(context);

        // Log build status immediately
        const filename = path.basename(config.outfile);
        const fullPath = config.outfile;
        if (fs.existsSync(fullPath)) {
          const size = (fs.statSync(fullPath).size / 1024 / 1024).toFixed(2);
          console.log(`[Build] ✓ Built ${filename} (${size}MB)\n`);
        }
      } catch (error) {
        console.error(
          `[Build] ❌ Failed to build ${path.basename(config.outfile)}:`,
          error.message
        );
        if (error.errors && error.errors.length > 0) {
          error.errors.forEach((err) => {
            console.error(`  - ${err.text}`);
            if (err.location) {
              console.error(
                `    at ${err.location.file}:${err.location.line}:${err.location.column}`
              );
            }
          });
        }
        throw error;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n[Build] ✨ All bundles built successfully in ${duration}s`);
    console.log('[Build] 👀 Watching for changes...\n');

    // Watch mode
    await Promise.all(contexts.map((ctx) => ctx.watch()));

    // Cleanup on exit
    process.on('SIGINT', async () => {
      console.log('\n[Build] Stopping watch mode...');
      await Promise.all(contexts.map((ctx) => ctx.dispose()));
      process.exit(0);
    });
  } catch (error) {
    console.error('[Build] ❌ Build failed:', error.message);
    process.exit(1);
  }
}

buildAll();
