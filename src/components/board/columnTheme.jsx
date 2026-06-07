/**
 * Column theme generator — creates status-specific styles for Kanban columns.
 * Palette-aware: supports cycling through board color themes.
 */

const THEME_VARIANTS = {
  events: {
    'New': {
      colorClasses: 'bg-gradient-to-br from-[#fbe0e2] to-[#f7b1bd] border-pink-200',
      headerClasses: 'bg-gradient-to-r from-[#f1889b] to-[#f7b1bd] border-pink-300',
    },
    'In Conversations': {
      colorClasses: 'bg-gradient-to-br from-[#fef4e6] to-[#fde4c8] border-yellow-200',
      headerClasses: 'bg-gradient-to-r from-[#f7b1bd] to-[#f1889b] border-pink-300',
    },
    'Waiting for Payment': {
      colorClasses: 'bg-gradient-to-br from-[#fbe0e2] to-[#f7b1bd] border-pink-200',
      headerClasses: 'bg-gradient-to-r from-[#f1889b] to-[#f7b1bd] border-pink-300',
    },
    'Confirmed': {
      colorClasses: 'bg-gradient-to-br from-[#e8f5f9] to-[#d1e7f0] border-blue-200',
      headerClasses: 'bg-gradient-to-r from-[#f1889b] to-[#f7b1bd] border-pink-300',
    },
    'Closed': {
      colorClasses: 'bg-gradient-to-br from-[#f3f4f6] to-[#e5e7eb] border-gray-200',
      headerClasses: 'bg-gradient-to-r from-[#9ca3af] to-[#d1d5db] border-gray-300',
    },
  },
  support: {
    'new': {
      colorClasses: 'bg-gradient-to-br from-[#f6eee7] to-[#ede4d8] border-yellow-100',
      headerClasses: 'bg-gradient-to-r from-[#b67651] to-[#d4a574] border-yellow-200',
    },
    'in_progress': {
      colorClasses: 'bg-gradient-to-br from-[#fde8d8] to-[#fcd4ba] border-orange-200',
      headerClasses: 'bg-gradient-to-r from-[#b67651] to-[#d4a574] border-yellow-200',
    },
    'waiting': {
      colorClasses: 'bg-gradient-to-br from-[#f6eee7] to-[#ede4d8] border-yellow-100',
      headerClasses: 'bg-gradient-to-r from-[#b67651] to-[#d4a574] border-yellow-200',
    },
    'resolved': {
      colorClasses: 'bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9] border-green-200',
      headerClasses: 'bg-gradient-to-r from-[#9ca3af] to-[#d1d5db] border-gray-300',
    },
  },
  partner: {
    'new': {
      colorClasses: 'bg-gradient-to-br from-[#fbe0e2] to-[#f7b1bd] border-pink-200',
      headerClasses: 'bg-gradient-to-r from-[#f7b1bd] to-[#fbe0e2] border-pink-300',
    },
    'reviewing': {
      colorClasses: 'bg-gradient-to-br from-[#fde8d8] to-[#fcd4ba] border-orange-200',
      headerClasses: 'bg-gradient-to-r from-[#f7b1bd] to-[#fbe0e2] border-pink-300',
    },
    'negotiating': {
      colorClasses: 'bg-gradient-to-br from-[#fff8e1] to-[#ffe082] border-yellow-200',
      headerClasses: 'bg-gradient-to-r from-[#f7b1bd] to-[#fbe0e2] border-pink-300',
    },
    'active': {
      colorClasses: 'bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9] border-green-200',
      headerClasses: 'bg-gradient-to-r from-[#f7b1bd] to-[#fbe0e2] border-pink-300',
    },
    'declined': {
      colorClasses: 'bg-gradient-to-br from-[#f3f4f6] to-[#e5e7eb] border-gray-200',
      headerClasses: 'bg-gradient-to-r from-[#9ca3af] to-[#d1d5db] border-gray-300',
    },
  },
};

export function getColumnTheme(boardKey, status) {
  const themes = THEME_VARIANTS[boardKey] || THEME_VARIANTS.events;
  const theme = themes[status];
  
  if (!theme) {
    return {
      colorClasses: 'bg-white border-gray-100',
      headerClasses: 'bg-gray-100 border-gray-200',
    };
  }

  return theme;
}

// Legacy exports for backward compatibility
export const COLUMN_COLOR_CLASSES = {
  'New': THEME_VARIANTS.events['New'].colorClasses,
  'In Conversations': THEME_VARIANTS.events['In Conversations'].colorClasses,
  'Waiting for Payment': THEME_VARIANTS.events['Waiting for Payment'].colorClasses,
  'Confirmed': THEME_VARIANTS.events['Confirmed'].colorClasses,
  'Closed': THEME_VARIANTS.events['Closed'].colorClasses,
};

export const COLUMN_HEADER_CLASSES = {
  'New': THEME_VARIANTS.events['New'].headerClasses,
  'In Conversations': THEME_VARIANTS.events['In Conversations'].headerClasses,
  'Waiting for Payment': THEME_VARIANTS.events['Waiting for Payment'].headerClasses,
  'Confirmed': THEME_VARIANTS.events['Confirmed'].headerClasses,
  'Closed': THEME_VARIANTS.events['Closed'].headerClasses,
};

export const DEFAULT_COLOR = 'bg-white border-gray-100';
export const DEFAULT_HEADER = 'bg-gray-100 border-gray-200';