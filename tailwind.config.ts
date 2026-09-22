import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "var(--gm-ink)",
          muted: "var(--gm-ink-muted)",
          faint: "var(--gm-ink-faint)",
        },
        paper: {
          DEFAULT: "var(--gm-paper)",
          raised: "var(--gm-paper-raised)",
          rule: "var(--gm-paper-rule)",
        },
        forest: {
          DEFAULT: "var(--gm-forest)",
          deep: "var(--gm-forest-deep)",
          mid: "var(--gm-forest-mid)",
          soft: "var(--gm-forest-soft)",
        },
        brass: {
          DEFAULT: "var(--gm-brass)",
          soft: "var(--gm-brass-soft)",
        },
        danger: "var(--gm-danger)",
        warning: "var(--gm-warning)",
        success: "var(--gm-success)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        desk: "0 1px 0 rgba(26, 31, 28, 0.06), 0 12px 32px rgba(20, 53, 40, 0.08)",
      },
      borderRadius: {
        gm: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
