/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aws: {
          orange: '#FF9900',
          blue: '#146EB4',
          green: '#00A651',
          red: '#DD344C',
          purple: '#7B68EE',
          yellow: '#FFD700',
        }
      }
    },
  },
  plugins: [],
}
