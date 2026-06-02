import type { Config } from "tailwindcss";

// الألوان مبنية على متغيّرات CSS (R G B) عشان نبدّل الوضع نهاري/مسائي وقت التشغيل
// بدون أي تعديل على المكوّنات. القيم معرّفة في globals.css (:root + [data-theme="night"]).
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        white: v("white"),
        ink: {
          DEFAULT: v("ink-900"),
          900: v("ink-900"),
          800: v("ink-800"),
          700: v("ink-700"),
          600: v("ink-600"),
          500: v("ink-500"),
          400: v("ink-400"),
          300: v("ink-300"),
        },
        clay: {
          50: v("clay-50"),
          100: v("clay-100"),
          200: v("clay-200"),
          300: v("clay-300"),
          400: v("clay-400"),
        },
        orange: {
          50: v("orange-50"),
          100: v("orange-100"),
          200: v("orange-200"),
          300: v("orange-300"),
          400: v("orange-400"),
          500: v("orange-500"),
          600: v("orange-600"),
          700: v("orange-700"),
          800: v("orange-800"),
        },
        gold: {
          DEFAULT: v("gold"),
          light: v("gold-light"),
        },
      },
      fontFamily: {
        sans: ["var(--font-arabic)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-arabic)", "Georgia", "serif"],
      },
      borderRadius: { "4xl": "2rem", "5xl": "2.75rem" },
      boxShadow: {
        soft: "0 1px 2px rgb(var(--shadow) / 0.05), 0 8px 24px -12px rgb(var(--shadow) / 0.18)",
        card: "0 2px 4px rgb(var(--shadow) / 0.05), 0 24px 48px -24px rgb(var(--shadow) / 0.28)",
        airy: "0 4px 32px -4px rgb(var(--shadow) / 0.10), 0 1px 4px rgb(var(--shadow) / 0.08)",
        "airy-lg": "0 8px 64px -8px rgb(var(--shadow) / 0.16), 0 2px 8px rgb(var(--shadow) / 0.10)",
        lift: "0 40px 80px -32px rgb(var(--shadow) / 0.42), 0 2px 6px rgb(var(--shadow) / 0.10)",
        "orange-glow": "0 16px 40px -12px rgb(var(--glow) / 0.45)",
      },
      letterSpacing: { tightest: "-0.01em" },
      keyframes: {
        "pulse-ring": { "0%": { transform: "scale(0.6)", opacity: "0.6" }, "100%": { transform: "scale(2.4)", opacity: "0" } },
        "float-slow": { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
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
