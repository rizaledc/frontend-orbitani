/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },

      /* ──────────────────────────────────────────────
       *  COLOR SYSTEM — 80 % White / 20 % Forest Green
       * ──────────────────────────────────────────── */
      colors: {
        /* Primary — Forest Green (aksen 20 %) */
        primary: {
          50:  '#f0f9f4',
          100: '#dbf0e3',
          200: '#b9e1ca',
          300: '#8bcba8',
          400: '#5aaf82',
          500: '#389468',
          600: '#277853',
          700: '#1f6044',
          800: '#1c4d38',
          900: '#1c4234',   // ← DEFAULT — the main forest green
          950: '#0d2319',
          DEFAULT: '#1c4234',
          hover: '#163a2d',
          light: '#277853',
        },

        /* Secondary — warm gold accent for CTAs */
        secondary: {
          DEFAULT: '#D98324',
          hover: '#BF721F',
          light: '#F0A94E',
        },

        /* Accent — teal highlight */
        accent: {
          DEFAULT: '#2DD4BF',
          light: '#5EEAD4',
          muted: '#2DD4BF33',
        },

        /* Surface / Neutral — the "80 % white" palette */
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F8FAFB',
          tertiary: '#F1F5F3',
          border: '#E5EBE8',
          hover: '#EDF2EF',
        },

        neutral: {
          DEFAULT: '#F8FAFB',
          text: '#1E293B',
          muted: '#64748B',
          card: '#FFFFFF',
        },

        /* Semantic */
        success: { DEFAULT: '#16A34A', light: '#DCFCE7' },
        warning: { DEFAULT: '#F59E0B', light: '#FEF9C3' },
        danger:  { DEFAULT: '#DC2626', light: '#FEE2E2' },
      },

      /* ──────────────────────────────────────────────
       *  ANIMATIONS
       * ──────────────────────────────────────────── */
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%':   { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%':   { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        shimmer:        'shimmer 1.5s ease-in-out infinite',
        'fade-in':      'fade-in 0.25s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'slide-in-right':'slide-in-right 0.3s ease-out',
        'slide-up':     'slide-up 0.3s ease-out',
        'pulse-soft':   'pulse-soft 2s ease-in-out infinite',
        'scale-in':     'scale-in 0.2s ease-out',
      },

      /* ──────────────────────────────────────────────
       *  SHADOWS & RADIUS
       * ──────────────────────────────────────────── */
      boxShadow: {
        'card':    '0 1px 3px rgba(28, 66, 52, 0.06), 0 1px 2px rgba(28, 66, 52, 0.04)',
        'card-hover': '0 10px 25px rgba(28, 66, 52, 0.08), 0 4px 10px rgba(28, 66, 52, 0.04)',
        'nav':     '0 1px 3px rgba(0,0,0,0.08)',
        'sidebar': '4px 0 16px rgba(28, 66, 52, 0.08)',
        'dropdown': '0 10px 40px rgba(28, 66, 52, 0.12), 0 2px 8px rgba(28, 66, 52, 0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
