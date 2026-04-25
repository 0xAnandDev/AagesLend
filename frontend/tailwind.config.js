/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: {
          DEFAULT: '#000000',
          light: '#1a1a1a',
        },
        grey: {
          DEFAULT: '#cccccc',
          light: '#333333',
        },
        white: '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Space Grotesk', 'sans-serif']
      }
    },
  },
  plugins: [],
}
