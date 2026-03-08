import flowbite from "flowbite-react/tailwind";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", flowbite.content()],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
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
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
        modalEnter: 'modalEnter 0.3s ease-out',
      },
    },
  },
  plugins: [flowbite.plugin()],
};