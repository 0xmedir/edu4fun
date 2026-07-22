import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FAF7F1",
        ink: "#2A2723",
        gold: "#B8872B",
        goldsoft: "#F1E4C6",
        forest: "#1F5A46",
        rust: "#A6432E",
        line: "#E7E0D2",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jbmono)", "monospace"],
      },
      borderRadius: {
        panel: "0.625rem",
      },
    },
  },
  plugins: [],
};

export default config;
