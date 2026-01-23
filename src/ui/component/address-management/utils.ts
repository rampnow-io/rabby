const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-orange-500',
];

// Predefined account colors palette for color picker
export const ACCOUNT_COLORS_PALETTE = [
  '#5B6FFF', // Blue
  '#89CBFF', // Light Blue
  '#9945FF', // Purple
  '#FF6B9D', // Pink
  '#FF8726', // Orange
  '#52C41A', // Green
  '#FFA940', // Orange 2
  '#1890FF', // Blue 2
  '#E91E63', // Magenta
  '#6F42C1', // Indigo
  '#2ECC71', // Green 2
  '#000000', // Black
].map((c) => c.toUpperCase()); // Normalize all colors to uppercase

/**
 * Get avatar color as hex value
 * Returns hex color directly for inline style usage
 */
export function getAvatarColor(seed: string | null | undefined): string {
  // If seed is a valid hex color (stored color from account), return it directly
  if (seed && seed.startsWith('#')) {
    return seed.toUpperCase();
  }

  if (!seed) {
    return ACCOUNT_COLORS_PALETTE[0]; // Return first color as default
  }

  // Hash-based color selection from palette for address-based colors
  let hash = 0;

  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  return ACCOUNT_COLORS_PALETTE[Math.abs(hash) % ACCOUNT_COLORS_PALETTE.length];
}

/**
 * Get style object for avatar color
 * Returns inline backgroundColor style with hex color
 */
export function getAvatarColorStyle(
  colorOrClass: string | null | undefined
): React.CSSProperties | undefined {
  if (!colorOrClass) return undefined;

  // Return style with hex color
  if (colorOrClass.startsWith('#')) {
    return {
      backgroundColor: colorOrClass,
    };
  }

  // If it's a hex from palette, treat as hex
  if (colorOrClass.match(/^#[0-9A-F]{6}$/i)) {
    return {
      backgroundColor: colorOrClass,
    };
  }

  return undefined;
}
