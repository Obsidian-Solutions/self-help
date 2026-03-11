/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['selector', '[class~="dark"]'],
  content: [
    './layouts/**/*.html',
    './content/**/*.md',
    './assets/js/**/*.js',
    './static/js/**/*.js',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#4F46E5',
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        secondary: '#10B981',
        accent: '#F59E0B',
        neutral: '#374151',
        brand: {
          soft: '#F8FAFF',
          muted: '#64748B',
          dark: '#0F172A',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      transitionDuration: {
        4000: '4000ms',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
  ],
};
