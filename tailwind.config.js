const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // Marka rengi — akademik güven için lacivert/indigo. TEK KAYNAK: tüm UI
        // 'primary-*' kullanmalı; marka rengi değişirse yalnız burası değişir.
        primary: colors.indigo,
      },
    },
  },
  plugins: [],
}

