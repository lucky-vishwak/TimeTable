import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          DEFAULT: "#0c0e14",
          soft: "#12141d",
          card: "#171a25",
          line: "#242838",
        },
        brand: {
          DEFAULT: "#6c5ce7",
          soft: "#8b7bf0",
          glow: "#a594ff",
        },
        cat: {
          general: "#60a5fa",
          focus: "#34d399",
          food: "#fbbf24",
          office: "#f472b6",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(108,92,231,.25), 0 8px 40px -12px rgba(108,92,231,.45)",
        card: "0 1px 0 0 rgba(255,255,255,.03) inset, 0 10px 30px -18px rgba(0,0,0,.8)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up .4s cubic-bezier(.16,1,.3,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
