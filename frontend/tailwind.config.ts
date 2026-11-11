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
        subtle: "0 1px 3px 0 rgba(7, 26, 24, 0.04), 0 1px 2px 0 rgba(7, 26, 24, 0.02)",
        card: "0 4px 12px -2px rgba(7, 26, 24, 0.06), 0 2px 6px -1px rgba(7, 26, 24, 0.03)",
        elevated: "0 14px 28px -6px rgba(7, 26, 24, 0.1), 0 6px 12px -4px rgba(13, 148, 136, 0.08)",
        premium: "0 20px 40px -12px rgba(7, 26, 24, 0.14), 0 4px 12px -2px rgba(13, 148, 136, 0.06)",
        glow: "0 0 24px -4px rgba(94, 234, 212, 0.25)",
      },
    },
  },
  plugins: [],
} satisfies Config;
