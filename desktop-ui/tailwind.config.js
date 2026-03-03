/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        jarvis: {
          bg: "#050913",
          panel: "#0a1222",
          cyan: "#26f2ff",
          cyanSoft: "#7cf7ff"
        }
      },
      boxShadow: {
        neon: "0 0 20px rgba(38, 242, 255, 0.45)",
        neonStrong: "0 0 50px rgba(38, 242, 255, 0.55)"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseCore: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.06)", opacity: "1" }
        }
      },
      animation: {
        fadeIn: "fadeIn 700ms ease-out both",
        pulseCore: "pulseCore 2.8s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
