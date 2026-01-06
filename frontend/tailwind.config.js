import tailwindAnimate from "tailwindcss-animate";
import scrollbarHide from "tailwind-scrollbar-hide";

/** @type {import('tailwindcss').Config} */
export default {
  // 🟢 CRITICAL: This ensures Tailwind scans all your React files for classes
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Matches the 'Inter' font imported in index.css
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      // Optional: Extend animations if you want to customize the speed
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    // 🟢 REQUIRED: Enables the 'animate-in', 'fade-in', 'zoom-in' classes
    tailwindAnimate,

    // 🟢 REQUIRED: Enables the 'scrollbar-hide' class for swipeable lists
    scrollbarHide,
  ],
}