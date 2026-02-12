import flowbite from "flowbite-react/tailwind";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", flowbite.content()],
  theme: {
    extend: {
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
        modalEnter: 'modalEnter 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        modalEnter: {
          '0%': { 
            opacity: '0', 
            transform: 'translate(0, 1rem) scale(0.95)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translate(0, 0) scale(1)' 
          },
        },
      },
    },
  },
  plugins: [flowbite.plugin()],
};