/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', "system-ui", "sans-serif"],
        display: ['"Space Grotesk"', '"Be Vietnam Pro"', "sans-serif"],
      },
      colors: {
        blush: {
          50: "#fff5f9",
          100: "#ffe8f1",
          200: "#ffd0e3",
          300: "#ffb3d1",
          400: "#f78fb3",
          500: "#ec7199",
          600: "#d9547d",
          700: "#b83d61",
          800: "#8f3350",
          900: "#5c2435",
        },
        mauve: {
          50: "#faf5fc",
          100: "#f3e8f8",
          200: "#e8d4f0",
          300: "#d4b8e4",
        },
      },
      boxShadow: {
        blush: "0 25px 60px rgba(236, 113, 153, 0.14)",
        "blush-lg": "0 35px 90px rgba(220, 150, 180, 0.18)",
        glass: "0 8px 32px rgba(235, 150, 180, 0.1)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
    },
  },
  plugins: [],
};
