import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Midnight & Copper system
        ink: {
          DEFAULT: "#0B0B0F",
          900: "#0B0B0F",
          800: "#101117",
          700: "#16181F",
          600: "#1E212A",
          500: "#272B36",
        },
        sand: {
          DEFAULT: "#EDE7DC",
          50: "#F6F2EA",
          100: "#EDE7DC",
          300: "#C9C1B2",
          500: "#9A958B",
          700: "#6B675F",
        },
        copper: {
          DEFAULT: "#C8773D",
          light: "#E2A86C",
          300: "#E2A86C",
          400: "#D38F4F",
          500: "#C8773D",
          600: "#A85F2C",
          700: "#824620",
          glow: "#F2B978",
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
        "copper-glow": "0 0 0 1px rgba(200,119,61,0.18), 0 24px 60px -20px rgba(200,119,61,0.35)",
        "card": "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 30px 60px -30px rgba(0,0,0,0.8)",
        "lift": "0 40px 80px -40px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06) inset",
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.6)", opacity: "0.7" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "shimmer": {
          "100%": { transform: "translateX(100%)" },
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
