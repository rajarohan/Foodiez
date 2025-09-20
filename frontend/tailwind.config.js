import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdefd7',
          200: '#fbd9ae',
          300: '#f8bb7a',
          400: '#f59444',
          500: '#f3731e',
          600: '#e45a14',
          700: '#bd4413',
          800: '#973717',
          900: '#7a2f16',
          950: '#42160a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    forms,
  ],
}