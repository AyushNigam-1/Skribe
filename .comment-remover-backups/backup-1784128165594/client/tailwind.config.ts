import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import tailwindScrollbar from "tailwind-scrollbar";

export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0A0A14",
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      const newUtilities = {
        ".word-spacing-1": {
          wordSpacing: "0.25rem",
        },
        ".word-spacing-2": {
          wordSpacing: "0.5rem",
        },
        ".word-spacing-3": {
          wordSpacing: "1rem",
        },
        ".word-spacing-4": {
          wordSpacing: "2rem",
        },
      };
      addUtilities(newUtilities);
    }),
    tailwindScrollbar({ nocompatible: true }),
  ],
} satisfies Config;