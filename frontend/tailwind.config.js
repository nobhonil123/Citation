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
          DEFAULT: '#1e3a5f',
          light: '#2d5a8e',
          dark: '#152a47',
        },
        accent: '#27ae60',
      },
    },
  },
  plugins: [],
}
