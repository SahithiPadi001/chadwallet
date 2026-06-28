/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0d0d0f",
          secondary: "#13131a",
          card: "#1a1a24",
          border: "#1e1e28",
        },
        brand: {
          purple: "#a78bfa",
          "purple-dim": "rgba(167,139,250,0.15)",
        },
        green: {
          trade: "#34d399",
          "trade-dim": "rgba(52,211,153,0.12)",
        },
        red: {
          trade: "#f87171",
          "trade-dim": "rgba(248,113,113,0.12)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        serif: ["Playfair Display", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
