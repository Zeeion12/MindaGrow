/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'biru-dasar': '#4169E1',  // Royal Blue untuk navbar
        'biru-tua': '#1e3a8a',    // Dark blue untuk footer
        'gold-first': '#FFD700',   // Gold untuk hover dan highlight
        'coklat': '#D2B48C',       // Tan untuk hover text
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}