import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        thmanyah: ["var(--font-thmanyah)", "Tahoma", "Arial", "sans-serif"],
      },
      colors: {
        ink: "#1d1a16",
        paper: "#fbf7ef",
        card: "#fffdf8",
        line: "#e9ddcb",
        saffron: "#e9a72f",
        mint: "#3f8f78",
        berry: "#9b4668",
      },
      boxShadow: {
        soft: "0 16px 45px rgba(64, 50, 31, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
