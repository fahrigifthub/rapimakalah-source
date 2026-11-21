/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        serif: ['"Times New Roman"', 'Times', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      colors: {
        ink: {
          900: '#0F172A',
          700: '#334155',
          500: '#52627A',
          400: '#5A6A80',
        },
        brand: {
          50: '#EFF5FF',
          100: '#DBE8FE',
          200: '#BFD7FE',
          300: '#93BBFD',
          400: '#6096FA',
          500: '#3B76F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
        },
        surface: '#F6F7F9',
        line: '#E6E8EC',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04)',
        pop: '0 12px 40px -12px rgba(15, 23, 42, 0.18)',
        paper: '0 2px 8px rgba(15, 23, 42, 0.06), 0 12px 32px -12px rgba(15, 23, 42, 0.12)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.25s ease-out',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
