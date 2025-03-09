/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'green': {
          800: '#1b5e20', // Dark green for header/footer
          700: '#2e7d32', // Section headings
          600: '#388e3c', // Buttons/primary
          500: '#43a047', // Secondary elements
          300: '#81c784', // Accents
          100: '#e8f5e9', // Background
        }
      }
    },
  },
  plugins: [],
}
