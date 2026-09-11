/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Primary Brand Blue
          700: '#1d4ed8',
          800: '#1e3a8a',
          900: '#0f274a', // Dark Glass Surfaces
          950: '#0a192f', // Deep Midnight Navy
          void: '#030712',
        },
        cyan: {
          accent: '#06b6d4',
          glow: '#22d3ee',
        }
      },
      fontFamily: {
        latin: ['var(--font-family-latin)', 'sans-serif'],
        arabic: ['var(--font-family-arabic)', 'sans-serif'],
        display: ['var(--font-family-display)', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(2, 6, 23, 0.45)',
        'glass-glow': '0 0 25px rgba(59, 130, 246, 0.25)',
        'cyan-glow': '0 0 25px rgba(6, 182, 212, 0.35)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      }
    },
  },
  plugins: [],
};
