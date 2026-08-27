import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: { 950: "#070708", 900: "#0B0C10", 800: "#12131A", 700: "#1B1C24", 600: "#2A2B34" },
        paper: { 50: "#F7F3EA", 100: "#EDE6D6", 300: "#C9BFA8", 500: "#8A8172" },
        gold: { 400: "#F0C14B", 500: "#E8A317", 600: "#C4840C" },
        mint: { 400: "#5EE6B0", 500: "#3DDC97" },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: { glow: "0 0 80px rgba(232, 163, 23, 0.12)" },
    },
  },
  plugins: [],
};
export default config;
