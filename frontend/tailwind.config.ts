import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        medinex: {
          dark: "#071A18",
          deep: "#063D38",
          teal: "#0D9488",
          "teal-hover": "#0F766E",
          mint: "#5EEAD4",
          "mint-light": "#E6FFFA",
          light: "#F7FAF9",
          card: "#FFFFFF",
          text: "#12201E",
          muted: "#64748B",
          border: "#E2E8F0",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        bangla: ["var(--font-hind-siliguri)", "sans-serif"],
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        card: "0 4px 6px -1px rgba(7, 26, 24, 0.05), 0 2px 4px -1px rgba(7, 26, 24, 0.03)",
        elevated: "0 10px 15px -3px rgba(7, 26, 24, 0.08), 0 4px 6px -2px rgba(7, 26, 24, 0.04)",
      },
    },
  },
  plugins: [],
} satisfies Config;
