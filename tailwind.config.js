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
          50: '#ecf3ee',
          100: '#d5e5d8',
          200: '#aecbb3',
          300: '#86b18d',
          400: '#5f9667',
          500: '#32663C',
          600: '#2c5935',
          700: '#254b2d',
          800: '#1e3d25',
          900: '#18301d',
        },
        secondary: {
          50: '#fff7f0',
          100: '#ffe8d6',
          200: '#ffd6b8',
          300: '#ffb88a',
          400: '#ff995d',
          500: '#F57A27',
          600: '#d66220',
          700: '#b54e1a',
          800: '#933f15',
          900: '#733311',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px rgba(17, 24, 39, 0.08)',
        card: '0 8px 24px rgba(15, 23, 42, 0.08)',
        lift: '0 12px 28px rgba(15, 23, 42, 0.14)',
      },
    },
  },
  plugins: [],
}