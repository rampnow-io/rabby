const colors = require('tailwindcss/colors');
const tinycolor2 = require('tinycolor2');
const uiConfig = require('./src/packages/ui/tailwind.config.ts');

const {
  themeColors,
  rabbyCssPrefix,
  appThemeColors,
  rabbyAppCssPrefix,
} = require('./src/constant/theme-colors');

const getRabbyColors = (colors, prefix) => {
  return ['light', 'dark'].reduce(
    (accu, theme) => {
      Object.entries(colors[theme]).forEach(([cssvarKey, colorValue]) => {
        // const splitorIdx = cssvarKey.indexOf('-');
        // const group = cssvarKey.slice(0, splitorIdx);
        // const suffix = cssvarKey.slice(splitorIdx + 1);
        const tinyColor = tinycolor2(colorValue);
        const alpha = tinyColor.getAlpha();

        const hexValue =
          alpha === 1 ? tinyColor.toHexString() : tinyColor.toHex8String();

        if (!accu.auto[cssvarKey]) {
          accu.auto[cssvarKey] = `var(--${prefix}${cssvarKey}, ${hexValue})`;
        }

        accu[theme][cssvarKey] = hexValue;
      });

      return accu;
    },
    {
      light: {},
      dark: {},
      auto: {},
    }
  );
};

const rabbyColors = getRabbyColors(themeColors, rabbyCssPrefix);
const rabbyAppColors = getRabbyColors(appThemeColors, rabbyAppCssPrefix);

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,html,css,less}',
    './src/packages/ui/dist/**/*.css',
  ],
  presets: [uiConfig],
  theme: {
    spacing: [
      0,
      1,
      2,
      4,
      6,
      8,
      10,
      12,
      14,
      16,
      18,
      20,
      24,
      28,
      32,
      40,
      60,
      80,
    ].reduce((m, n) => {
      m[n] = `${n}px`;
      return m;
    }, {}),
    screens: {
      sm: { max: '600px' },
      lg: { min: '600px' },
    },
    fontSize: {
      12: [
        '12px',
        {
          lineHeight: '14px',
        },
      ],
      13: '13px',
      14: [
        '14px',
        {
          lineHeight: '18px',
        },
      ],
      15: [
        '15px',
        {
          lineHeight: '18px',
        },
      ],
      18: [
        '18px',
        {
          lineHeight: '22px',
        },
      ],
      20: '20px',
      24: [
        '24px',
        {
          lineHeight: '28px',
        },
      ],
      28: [
        '28px',
        {
          lineHeight: '33px',
        },
      ],
    },
    /** @notice configuration here would override the default config above */
    extend: {
      colors: {
        [`${rabbyCssPrefix.replace(/\-$/, '')}`]: rabbyColors.auto,
        [`${'rabby-'.replace(/\-$/, '')}`]: rabbyColors.auto,
        [`${'-r-'.replace(/\-$/, '')}`]: rabbyColors.auto,

        [`light-${rabbyCssPrefix.replace(/\-$/, '')}`]: rabbyColors.light,
        [`dark-${rabbyCssPrefix.replace(/\-$/, '')}`]: rabbyColors.dark,

        [`${rabbyAppCssPrefix.replace(/\-$/, '')}`]: rabbyAppColors.auto,
        [`light-${rabbyAppCssPrefix.replace(/\-$/, '')}`]: rabbyAppColors.light,
        [`dark-${rabbyAppCssPrefix.replace(/\-$/, '')}`]: rabbyAppColors.dark,
      },
    },
  },
  // use class insteadof media-query prefers-color-scheme
  // see https://v2.tailwindcss.com/docs/dark-mode
  darkMode: 'class',
  important: true,
};
