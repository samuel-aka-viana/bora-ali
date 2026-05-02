/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        fraunces: ["Georgia", "Times New Roman", "serif"],
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"],
      },
      colors: {
        primary: "#C1121F",
        "primary-dark": "#8F0D17",
        accent: "#F4A261",
        background: "#FAF7F2",
        surface: "#FFFFFF",
        text: "#1A1208",
        muted: "#6F5D4D",
        border: "#E8E0D8",
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#DC2626",
      },
      keyframes: {
        fadeSlideUp: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-slide-up": "fadeSlideUp 0.45s ease-out both",
        "fade-in": "fadeIn 0.3s ease-out both",
      },
    },
  },
  plugins: [],
};
