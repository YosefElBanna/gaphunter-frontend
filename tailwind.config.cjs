/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "rgb(var(--bg-main) / <alpha-value>)",
          card: "rgb(var(--bg-card) / <alpha-value>)",
          border: "rgb(var(--border-main) / <alpha-value>)",
          text: "rgb(var(--text-main) / <alpha-value>)",
          muted: "rgb(var(--text-muted) / <alpha-value>)",
          accent: "rgb(var(--accent) / <alpha-value>)",
          danger: "rgb(var(--danger) / <alpha-value>)",
          surface: "rgb(var(--tag-surface) / <alpha-value>)",
          workflow: "rgb(var(--tag-workflow) / <alpha-value>)",
          tech: "rgb(var(--tag-tech) / <alpha-value>)",
          industry: "rgb(var(--tag-industry) / <alpha-value>)",
        },
      },
      fontFamily: {
        body: ['"Inter"', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
