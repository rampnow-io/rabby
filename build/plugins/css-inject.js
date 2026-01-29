/**
 * ESBuild CSS Inject Plugin
 * 
 * Handles CSS imports by converting them to JavaScript that injects
 * styles into the page at runtime, ensuring side effects are preserved.
 */

const { readFile } = require('fs/promises');
const path = require('path');

function cssInjectPlugin() {
  return {
    name: 'css-inject',
    setup(build) {
      build.onLoad({ filter: /\.css$/ }, async (args) => {
        const css = await readFile(args.path, 'utf8');
        
        // Escape CSS for JavaScript string
        const escaped = css
          .replace(/\\/g, '\\\\')
          .replace(/`/g, '\\`')
          .replace(/\$/g, '\\$');
        
        // Generate JavaScript that injects CSS
        const contents = `
(() => {
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = \`${escaped}\`;
    document.head.appendChild(style);
  }
})();
`;
        
        return {
          contents,
          loader: 'js',
        };
      });
    },
  };
}

module.exports = cssInjectPlugin;
