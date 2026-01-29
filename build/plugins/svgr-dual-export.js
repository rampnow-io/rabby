/**
 * ESBuild plugin for SVG React Components with URL fallback
 * 
 * Default export is a URL (for <img src={} />), named export is ReactComponent.
 */

const { readFile } = require('fs/promises');
const { transform } = require('@svgr/core');

function svgrDualExportPlugin(options = {}) {
  return {
    name: 'svgr-dual-export',
    setup(build) {
      // Resolve ?url imports to file loader
      build.onResolve({ filter: /\.svg\?url$/ }, (args) => ({
        path: args.path.replace(/\?url$/, ''),
        namespace: 'svg-url',
      }));

      build.onLoad({ filter: /.*/, namespace: 'svg-url' }, async (args) => {
        const contents = await readFile(args.path);
        return { contents, loader: 'file' };
      });

      build.onLoad({ filter: /\.svg$/ }, async (args) => {
        const svg = await readFile(args.path, 'utf8');

        // Transform SVG to React component using SVGR
        const jsCode = await transform(
          svg,
          {
            plugins: ['@svgr/plugin-jsx'],
            typescript: true,
            memo: false,
            exportType: 'default',
            ...options,
          },
          { filePath: args.path }
        );

        const hasDefault = /export default (\w+);?/.test(jsCode);
        const componentCode = hasDefault
          ? jsCode.replace(/export default (\w+);?/, 'const ReactComponent = $1;')
          : `${jsCode}\nconst ReactComponent = () => null;`;

        const contents = [
          `import svgUrl from ${JSON.stringify(args.path + '?url')};`,
          componentCode,
          'export { ReactComponent };',
          'export default svgUrl;',
        ].join('\n');

        return {
          contents,
          loader: 'tsx',
        };
      });
    },
  };
}

module.exports = svgrDualExportPlugin;
