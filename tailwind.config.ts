import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#004ac6",
          container: "#2563eb",
          on: "#ffffff",
          "on-container": "#001a4b",
        },
        secondary: {
          DEFAULT: "#565e74",
          container: "#dae2fd",
          "on-container": "#131c2e",
        },
        tertiary: {
          DEFAULT: "#6a1edb",
          container: "#8343f4",
          "on-container": "#22005d",
        },
        error: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
          on: "#ffffff",
          "on-container": "#410002",
        },
        surface: {
          DEFAULT: "#f7f9fb",
          container: "#eceef0",
          "container-low": "#f2f4f6",
          "container-high": "#e6e8ea",
          "container-lowest": "#ffffff",
          "container-highest": "#e0e3e5",
        },
        "on-surface": {
          DEFAULT: "#191c1e",
          variant: "#434655",
        },
        outline: {
          DEFAULT: "#737686",
          variant: "#c3c6d7",
        },
      },
      fontFamily: {
        headline: ["Manrope", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem",
      },
      boxShadow: {
        ambient: "0 4px 32px rgba(25, 28, 30, 0.06)",
        "ambient-lg": "0 8px 48px rgba(25, 28, 30, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
