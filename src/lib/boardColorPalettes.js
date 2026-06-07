/**
 * Board color palettes — cycle through the user's color scheme.
 * Each board gets a distinct accent, background gradient, and column themes.
 */

export const COLOR_PALETTES = {
  events: {
    name: 'Events',
    accentPrimary: '#f1889b',      // Hot pink
    accentSecondary: '#f7b1bd',    // Light pink
    accentLight: '#fbe0e2',         // Very light pink
    background: 'linear-gradient(160deg, #fdf2f6 0%, #fce7ef 45%, #f9d9e6 100%)',
    headerBg: 'linear-gradient(135deg, rgba(251,224,226,0.5), rgba(255,255,255,0.95))',
    headerBorder: 'rgba(247,177,189,0.3)',
    cardBg: 'rgba(255,255,255,0.95)',
  },
  support: {
    name: 'Support',
    accentPrimary: '#b67651',      // Warm brown
    accentSecondary: '#d4a574',    // Lighter brown
    accentLight: '#f6eee7',         // Cream
    background: 'linear-gradient(160deg, #faf6f3 0%, #f3e6dc 45%, #ece0d4 100%)',
    headerBg: 'linear-gradient(135deg, rgba(246,238,231,0.7), rgba(255,255,255,0.95))',
    headerBorder: 'rgba(182,118,81,0.2)',
    cardBg: 'rgba(255,255,255,0.96)',
  },
  partner: {
    name: 'Partner',
    accentPrimary: '#f7b1bd',      // Medium pink
    accentSecondary: '#fbe0e2',    // Light pink
    accentLight: '#f6eee7',         // Cream
    background: 'linear-gradient(160deg, #fcf4f7 0%, #fae8f0 45%, #f4dce8 100%)',
    headerBg: 'linear-gradient(135deg, rgba(251,224,226,0.6), rgba(255,255,255,0.94))',
    headerBorder: 'rgba(247,177,189,0.25)',
    cardBg: 'rgba(255,255,255,0.94)',
  },
};

export const getColorPalette = (boardKey) => COLOR_PALETTES[boardKey] || COLOR_PALETTES.events;