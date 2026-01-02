/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Ensures clean, modern typography across the dashboard
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    // 🟢 REQUIRED: Enables the 'animate-in', 'fade-in', 'zoom-in' classes used in your components
    // Run: npm install -D tailwindcss-animate
    require("tailwindcss-animate"),

    // 🟢 REQUIRED: Enables the 'scrollbar-hide' class used in Rooms and POS tabs
    // Run: npm install -D tailwind-scrollbar-hide
    require("tailwind-scrollbar-hide"),
  ],
}