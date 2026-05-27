/**
 * ScholarFlow Design Tokens - Colors
 * Fresh green-blue (teal/cyan) palette for scientific precision.
 */

export const colors = {
  /** Primary brand palette (Teal) */
  primary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
    950: '#042f2e',
  },

  /** Accent palette (Cyan) */
  accent: {
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
  },

  /** Semantic colors */
  success: {
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
  },
  warning: {
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
  },
  error: {
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
  },
  info: {
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
  },
} as const;

/**
 * Neutral slate palette as RGB channels for alpha support.
 * Light mode values (dark mode overrides in CSS).
 */
export const slateRgb = {
    50: '248 250 252',
    100: '241 245 249',
    150: '226 232 240',
    200: '226 232 240',
    250: '203 213 225',
    300: '203 213 225',
    350: '176 190 210',
    400: '148 163 184',
    450: '128 145 168',
    500: '100 116 139',
    550: '82 98 120',
    600: '71 85 105',
    650: '58 72 94',
    700: '51 65 85',
    750: '40 52 72',
    800: '30 41 59',
    850: '22 33 52',
    900: '15 23 42',
    905: '12 20 38',
    950: '2 6 23',
    955: '1 4 16',
} as const;
