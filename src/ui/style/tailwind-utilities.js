const plugin = require('tailwindcss/plugin');

module.exports = plugin(function({ addUtilities, addComponents, theme }) {
  // Utility classes from LESS mixins
  const utilities = {
    '.ellipsis': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '.chromelike-scrollbar': {
      '&::-webkit-scrollbar': {
        width: '6px',
        backgroundColor: 'var(--r-neutral-line, rgba(255, 255, 255, 0.1))',
        paddingLeft: '1px',
        paddingRight: '1px',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: 'rgba(var(--r-neutral-foot-rgb), 0.5)',
        borderRadius: '4px',
      },
    },
    '.chromelike-scrollbar-v1': {
      '&::-webkit-scrollbar': {
        width: '6px',
        backgroundColor: 'transparent',
        paddingLeft: '1px',
        paddingRight: '1px',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: 'var(--rb-neutral-line, #e0e5ec)',
        borderRadius: '1000px',
      },
    },
    '.hide-scrollbar': {
      '&::-webkit-scrollbar': {
        display: 'none',
      },
      '-ms-overflow-style': 'none',
      'scrollbar-width': 'none',
    },
    '.page-layout': {
      minHeight: '100vh',
      backgroundColor: 'var(--r-neutral-bg-2, #f5f6fa)',
      paddingLeft: '20px',
      paddingRight: '20px',
    },
  };

  // Add keyframe animations
  const animations = {
    '@keyframes fadeIn': {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    '@keyframes fadeOut': {
      '0%': { opacity: '1' },
      '100%': { opacity: '0' },
    },
    '@keyframes fadeLeft': {
      '0%': { right: '5%' },
      '100%': { right: '100%' },
    },
    '@keyframes fadeInLeft': {
      '0%': { right: '100%' },
      '100%': { right: '5%' },
    },
    '@keyframes fadeInRight': {
      '0%': { left: '100%' },
      '100%': { left: '5%' },
    },
    '@keyframes fadeOutRight': {
      '0%': { left: '5%', opacity: '0' },
      '100%': { left: '100%', opacity: '0' },
    },
    '@keyframes fadeOutLeft': {
      '0%': { right: '5%', opacity: '0' },
      '100%': { right: '100%', opacity: '0' },
    },
    '@keyframes fadeOutBottom': {
      '0%': { top: '240px' },
      '100%': { top: '600px' },
    },
    '@keyframes fadeOutTop': {
      '0%': { top: '20px', width: '100%', display: 'flex', justifyContent: 'flex-start', opacity: '1' },
      '100%': { top: '-50px', width: '100%', display: 'flex', justifyContent: 'flex-start', opacity: '0' },
    },
    '@keyframes fadeInTop': {
      '0%': { top: '-50px', width: '100%', display: 'flex', justifyContent: 'flex-start', opacity: '0' },
      '100%': { top: '0', width: '100%', display: 'flex', justifyContent: 'flex-start', opacity: '1' },
    },
    '@keyframes spining': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
  };

  addUtilities(utilities);
  addUtilities(animations);
});
