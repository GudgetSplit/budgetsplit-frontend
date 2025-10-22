/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src//*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: { green: "#06623B", gold: "#F7C948" },
      },
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui"] },
    },
  },
  plugins: [],
};