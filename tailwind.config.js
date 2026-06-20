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
        // Marka rengi — akademik güven için LACİVERT. TEK KAYNAK: tüm UI 'primary-*'
        // kullanmalı; marka rengi değişirse yalnız burası değişir.
        // 600 = ana vurgu (#1e3a8a), 700 = koyu vurgu (#15296b), 800/900 = gradient koyu.
        primary: {
          50: '#eef1f9',
          100: '#dde4f4',
          200: '#c4d2ef',
          300: '#9bb0e0',
          400: '#5e7cc4',
          500: '#2a52a8',
          600: '#1e3a8a',
          700: '#15296b',
          800: '#14224f',
          900: '#0f1a3d',
        },
        // Editöryel akademik zemin/çizgi/mürekkep tokenları
        paper: '#f7f5ef',        // sıcak kâğıt (landing / pazarlama sayfaları)
        'paper-cool': '#eef2f0', // serin kâğıt (uygulama sayfaları)
        ink: '#1c1a17',          // ana metin
        line: '#e4e0d4',         // sıcak kenarlık (pazarlama)
        'line-cool': '#e3e8e5',  // serin kenarlık (uygulama)
      },
      fontFamily: {
        // Gövde = Hanken Grotesk, başlıklar = Spectral (font-serif ile opt-in)
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'Cambria', 'serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
