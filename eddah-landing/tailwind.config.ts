import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm near-black for text
        ink: {
          DEFAULT: "#1A1714",
          900: "#1A1714",
          800: "#241F1A",
          700: "#3A332C",
          600: "#5A5046",
          500: "#756B5E",
          400: "#9A9082",
          300: "#B6AC9D",
        },
        // Warm neutral surfaces (the "paper" of the brand)
        clay: {
          50: "#FBFAF7",
          100: "#F4EEE6",
          200: "#EAE1D4",
          300: "#D9CDBB",
          400: "#C3B6A1",
        },
        // Brand orange (from the عدة logo)
        orange: {
          50: "#FDF2E4",
          100: "#FBE3C6",
          200: "#F8D0A2",
          300: "#F6B877",
          400: "#F39B3D",
          500: "#F0851A",
          600: "#DC6E0B",
          700: "#B0530A",
          800: "#8A4109",
        },
      },
      fontFamily: {
        sans: ["var(--font-arabic)", "system-ui", "sans-serif"],
        display: ["var(--font-arabic)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(26,23,20,0.04), 0 8px 24px -12px rgba(26,23,20,0.12)",
        card: "0 2px 4px rgba(26,23,20,0.03), 0 24px 48px -24px rgba(26,23,20,0.18)",
        lift: "0 40px 80px -32px rgba(26,23,20,0.28), 0 2px 6px rgba(26,23,20,0.05)",
        "orange-glow": "0 16px 40px -12px rgba(240,133,26,0.45)",
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.6)", opacity: "0.6" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 3.2s cubic-bezier(0.16,1,0.3,1) infinite",
        "float-slow": "float-slow 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
