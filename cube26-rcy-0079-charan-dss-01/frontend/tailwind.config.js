/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: "#FBFBFA",
          subtle: "#F5F6F1",
          card: "#FFFFFF",
          muted: "#EFEFEA",
        },
        charcoal: {
          DEFAULT: "#0F172A",
          muted: "#475569",
          light: "#64748B",
          dark: "#020617",
        },
        teal: {
          DEFAULT: "#0F766E",
          dark: "#115E59",
          light: "#0D9488",
          subtle: "#F0FDFA",
        },
        sage: {
          DEFAULT: "#10B981",
          subtle: "#ECFDF5",
          border: "#A7F3D0",
          text: "#065F46",
        },
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px -1px rgba(0, 0, 0, 0.03)",
        card: "0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)",
        "card-hover": "0 4px 12px 0 rgba(15, 23, 42, 0.06), 0 1px 3px -1px rgba(15, 23, 42, 0.03)",
      },
    },
  },
  plugins: [],
};
