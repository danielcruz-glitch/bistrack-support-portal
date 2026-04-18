import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nexus: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
        brand: {
          DEFAULT: "#3B82F6",
          dark: "#2563EB",
          light: "#93C5FD",
        },
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(15, 23, 42, 0.04)",
        soft: "0 1px 2px rgba(15, 23, 42, 0.04)",
      },
      borderRadius: {
        xl2: "1rem",
      },
      backgroundImage: {
        "nexus-grid":
          "linear-gradient(to right, rgba(148,163,184,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.10) 1px, transparent 1px)",
        "nexus-radial":
          "radial-gradient(circle at top left, rgba(59,130,246,0.12), transparent 35%)",
      },
      backgroundSize: {
        grid: "24px 24px",
      },
    },
  },
  plugins: [],
};

export default config;