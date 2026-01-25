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
      colors: {
        primary: '#4F46E5', // Indigo 600
        secondary: '#10B981', // Emerald 500
        accent: '#F59E0B', // Amber 500
        neutral: '#374151', // Gray 700
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
