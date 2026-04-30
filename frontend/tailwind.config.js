/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#EA1D2C",
        "primary-dark": "#B91422",
        background: "#FAFAFA",
        surface: "#FFFFFF",
        text: "#1F2937",
        muted: "#6B7280",
        border: "#E5E7EB",
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#DC2626",
      },
    },
  },
  plugins: [],
};
