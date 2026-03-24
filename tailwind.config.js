const colors = require('tailwindcss/colors');
const tinycolor2 = require('tinycolor2');
const uiConfig = require('./src/packages/ui/tailwind.config.ts');
const rabbyUtilities = require('./src/ui/style/tailwind-utilities');

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
    './src/**/*.{js,jsx,tsx,html,css,less}', // Exclude .ts files to avoid node_modules scan
    './src/packages/ui/src/**/*.{js,ts,jsx,tsx}', // Scan UI package source files for Tailwind classes
    './src/packages/ui/dist/**/*.css',
  ],
  presets: [uiConfig],
  theme: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    },
    extend: {
      screens: {
        sm: { max: '600px' },
        lg: { min: '600px' },
      },
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
  plugins: [rabbyUtilities],
};
