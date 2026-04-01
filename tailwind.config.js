/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#1c4234',
          hover: '#0C2D27',
          light: '#2D6B60',
        },
        secondary: {
          DEFAULT: '#D98324',
          hover: '#BF721F',
        },
        accent: {
          DEFAULT: '#2DD4BF',
        },
        neutral: {
          DEFAULT: '#F1F5F9',
          text: '#1E293B',
          card: '#FFFFFF',
        },
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
