/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1C3A6E",
          50: "#EEF2F9",
          100: "#DCE5F3",
          400: "#4F6FA0",
          600: "#25497F",
          700: "#1C3A6E",
          800: "#152C55",
          900: "#0E1E3B",
        },
        sky: {
          accent: "#4FC3F7",
        },
        violet: {
          accent: "#6C63FF",
        },
        cream: "#F2EBD9",
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
