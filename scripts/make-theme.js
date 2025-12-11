#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const lessVarsToJs = require('less-vars-to-js');
const tinycolor2 = require('tinycolor2');

const {
  themeColors,
  rabbyCssPrefix,
  appThemeColors,
  rabbyAppCssPrefix,
} = require('../src/constant/theme-colors');

const ROOT = path.resolve(__dirname, '..');

const cssvarSrcfile = path.resolve(ROOT, 'src/ui/style/cssvars.css');

const SPACES = `  `;
const LINE_BREAK = '\n';

const SPECIAL_DEFAULT_ALPHA = {
  light: [],
  dark: [],
};

makeCssVar: {
  const cssvarSrcContent = `
/* this file is genetared automatically, never modify it manually! */
:root {
  --rabby-color-opacity: 1;
  --tw-bg-opacity: 1;

  /* -------------------- base define -------------------- */
${['light', 'dark']
  .map((theme) => {
    return Object.entries(themeColors[theme])
      .map(([cssvarKey, colorValue]) => {
        const varcore = cssvarKey.replace(/^\-\-/, '');

        return `${SPACES}--rabby-${theme}-${varcore}: ${colorValue};`;
      })
      .join(LINE_BREAK);
  })
  .join(LINE_BREAK.repeat(2))}


${['light', 'dark']
  .map((theme) => {
    return Object.entries(appThemeColors[theme])
      .map(([cssvarKey, colorValue]) => {
        const varcore = cssvarKey.replace(/^\-\-/, '');

        return `${SPACES}--rb-${theme}-${varcore}: ${colorValue};`;
      })
      .join(LINE_BREAK);
  })
  .join(LINE_BREAK.repeat(2))}
}

${[
  {
    theme: 'light',
    parentSelector: ':root',
  },
  {
    theme: 'dark',
    parentSelector: 'html.dark, body.dark',
  },
]
  .map(({ theme, parentSelector }) => {
    const isDarkTheme = theme === 'dark';

    return `${parentSelector} {
${SPACES}/* -------------------- ${theme} mode -------------------- */
${Object.entries(themeColors[theme])
  .map(([cssvarKey, colorValue]) => {
    const varcore = cssvarKey.replace(/^\-\-/, '');

    const tinyColor = tinycolor2(colorValue);
    const rgbs = tinyColor.toRgb();
    const alpha = tinyColor.getAlpha();
    if (alpha !== 1) {
      SPECIAL_DEFAULT_ALPHA[theme].push({ cssvarKey, alpha });
    }

    return [
      `${SPACES}--${rabbyCssPrefix}${cssvarKey}-rgb: ${rgbs.r}, ${rgbs.g}, ${rgbs.b};`,
      // `${SPACES}--${rabbyCssPrefix}${cssvarKey}-opacity: ${alpha};`,
      // `${SPACES}--${rabbyCssPrefix}${cssvarKey}: rgba(${rgbs.r}, ${rgbs.g}, ${rgbs.b}, var(--${rabbyCssPrefix}${cssvarKey}-opacity, 1));`,
      `${SPACES}--${rabbyCssPrefix}${cssvarKey}: var(--rabby-${theme}-${varcore});`,
    ]
      .filter(Boolean)
      .join(LINE_BREAK);
  })
  .join(LINE_BREAK)}

  ${LINE_BREAK}

  ${Object.entries(appThemeColors[theme])
    .map(([cssvarKey, colorValue]) => {
      const varcore = cssvarKey.replace(/^\-\-/, '');

      const tinyColor = tinycolor2(colorValue);
      const rgbs = tinyColor.toRgb();
      const alpha = tinyColor.getAlpha();
      if (alpha !== 1) {
        SPECIAL_DEFAULT_ALPHA[theme].push({ cssvarKey, alpha });
      }

      return [
        `${SPACES}--${rabbyAppCssPrefix}${cssvarKey}-rgb: ${rgbs.r}, ${rgbs.g}, ${rgbs.b};`,
        // `${SPACES}--${rabbyAppCssPrefix}${cssvarKey}-opacity: ${alpha};`,
        // `${SPACES}--${rabbyAppCssPrefix}${cssvarKey}: rgba(${rgbs.r}, ${rgbs.g}, ${rgbs.b}, var(--${rabbyAppCssPrefix}${cssvarKey}-opacity, 1));`,
        `${SPACES}--${rabbyAppCssPrefix}${cssvarKey}: var(--rb-${theme}-${varcore});`,
      ]
        .filter(Boolean)
        .join(LINE_BREAK);
    })
    .join(LINE_BREAK)}
}
${
  !SPECIAL_DEFAULT_ALPHA[theme].length
    ? ''
    : SPECIAL_DEFAULT_ALPHA[theme]
        .map(({ cssvarKey, alpha }) => {
          return [
            //     `${isDarkTheme ? `.dark ` : ''} {
            // ${SPACES}--${rabbyCssPrefix}${cssvarKey}-opacity: ${alpha};
            // }`,
            //     `${isDarkTheme ? `.dark ` : ''}.bg-${rabbyCssPrefix}${cssvarKey} {
            // ${SPACES}--bg-${rabbyCssPrefix}${cssvarKey}-opacity: ${alpha};
            // }`,
          ]
            .filter(Boolean)
            .join(LINE_BREAK);
        })
        .filter(Boolean)
        .join(LINE_BREAK)
}`;
  })
  .join(LINE_BREAK)}
`;
  fs.writeFileSync(cssvarSrcfile, cssvarSrcContent, 'utf8');

  console.log('[rabby] make-theme css vars version success!');
}

makeVarsInJs: {
  // Static palette definition (migrated from var.less to support legacy code)
  const palette = {
    "@primary-color": "#4c65ff",
    "@primary-text-color": "#4c65ff",
    "@light-purple": "#826fff",
    "@primary-linear": "linear-gradient(97.59deg, #8ba8ff 0%, #8c96ff 99.49%)",
    "@color-green": "#27c193",
    "@color-orange": "#ffb020",
    "@color-red": "#ec5151",
    "@color-403": "#af160e",
    "@color-white": "#fff",
    "@color-black": "#000",
    "@color-title": "#13141a",
    "@color-body": "#4b4d59",
    "@color-comment": "#707280",
    "@color-comment-1": "#707280",
    "@color-comment-2": "#b4bdcc",
    "@color-bg": "#f5f6fa",
    "@color-border": "#e5e9ef",
    "@btn-shadow": "none",
    "@btn-primary-shadow": "none",
    "@btn-font-weight": "500",
    "@btn-font-size-lg": "15px",
    "@btn-default-bg": "#b4bdcc",
    "@btn-default-border": "#b4bdcc",
    "@btn-default-color": "white",
    "@btn-height-lg": "44px",
    "@btn-padding-horizontal-lg": "13px",
    "@btn-disable-color": "white",
    "@btn-disable-bg": "#e5e9ef",
    "@btn-disable-border": "#e5e9ef",
    "@input-border-color": "white",
    "@input-padding-vertical-lg": "15px",
    "@input-padding-horizontal-lg": "16px",
    "@error-color": "#f24822",
    "@font-size-lg": "14px",
    "@outline-width": "0",
    "@switch-min-width": "32px",
    "@switch-height": "16px",
    "@modal-header-padding": "16px",
    "@modal-body-padding": "20px 16px 24px",
    "@modal-confirm-body-padding": "20px 16px 24px"
  };

  const fname = path.basename(__filename);

  fs.writeFileSync(
    path.resolve(ROOT, './src/ui/style/var-defs.ts'),
    `\
/* eslint-disable */
/* this file is genetared by ${fname} automatically, never modify it manually! */
const LessPalette = ${JSON.stringify(palette, null, '  ')};

export function ellipsis(){
  return \`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  \`
}

export default LessPalette;
`
  );

  console.log('[rabby] make-theme js version success!');
}
