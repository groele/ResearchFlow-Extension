import type { Config } from 'tailwindcss';

export default {
  content: [
    './entrypoints/**/*.{html,ts,tsx}',
    './src/**/*.{html,ts,tsx,css}',
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        // Primary brand color (Teal) - uses CSS variables for alpha support
        primary: {
          50: 'rgba(var(--color-primary-50), <alpha-value>)',
          100: 'rgba(var(--color-primary-100), <alpha-value>)',
          200: 'rgba(var(--color-primary-200), <alpha-value>)',
          300: 'rgba(var(--color-primary-300), <alpha-value>)',
          400: 'rgba(var(--color-primary-400), <alpha-value>)',
          500: 'rgba(var(--color-primary-500), <alpha-value>)',
          600: 'rgba(var(--color-primary-600), <alpha-value>)',
          700: 'rgba(var(--color-primary-700), <alpha-value>)',
          800: 'rgba(var(--color-primary-800), <alpha-value>)',
          900: 'rgba(var(--color-primary-900), <alpha-value>)',
          950: 'rgba(var(--color-primary-950), <alpha-value>)',
        },
        // Neutral slate - uses CSS variables for light/dark mode switching
        slate: {
          50: 'rgba(var(--color-slate-50), <alpha-value>)',
          100: 'rgba(var(--color-slate-100), <alpha-value>)',
          150: 'rgba(var(--color-slate-150), <alpha-value>)',
          200: 'rgba(var(--color-slate-200), <alpha-value>)',
          250: 'rgba(var(--color-slate-250), <alpha-value>)',
          300: 'rgba(var(--color-slate-300), <alpha-value>)',
          350: 'rgba(var(--color-slate-350), <alpha-value>)',
          400: 'rgba(var(--color-slate-400), <alpha-value>)',
          450: 'rgba(var(--color-slate-450), <alpha-value>)',
          500: 'rgba(var(--color-slate-500), <alpha-value>)',
          550: 'rgba(var(--color-slate-550), <alpha-value>)',
          600: 'rgba(var(--color-slate-600), <alpha-value>)',
          650: 'rgba(var(--color-slate-650), <alpha-value>)',
          700: 'rgba(var(--color-slate-700), <alpha-value>)',
          750: 'rgba(var(--color-slate-750), <alpha-value>)',
          800: 'rgba(var(--color-slate-800), <alpha-value>)',
          850: 'rgba(var(--color-slate-850), <alpha-value>)',
          900: 'rgba(var(--color-slate-900), <alpha-value>)',
          905: 'rgba(var(--color-slate-905), <alpha-value>)',
          950: 'rgba(var(--color-slate-950), <alpha-value>)',
          955: 'rgba(var(--color-slate-955), <alpha-value>)',
        },
        // Semantic colors (direct hex, no alpha needed)
        success: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          950: '#022c22',
        },
        warning: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          950: '#451a03',
        },
        error: {
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          950: '#4c0519',
        },
        info: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          950: '#083344',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],  // 10px
        '3xs': ['0.5625rem', { lineHeight: '0.75rem' }],   // 9px
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'fade-in-slow': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.2s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
} satisfies Config;
