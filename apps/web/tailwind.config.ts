import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
    "../../packages/lib/src/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: {
        "2xl": "1400px"
      }
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        graphite: {
          950: "#050607",
          900: "#0b0d10",
          850: "#111419",
          800: "#171b21",
          700: "#242932",
          600: "#363c46"
        },
        gold: {
          50: "#fbf6e8",
          100: "#f3e7c5",
          200: "#e4cc8d",
          300: "#d4af5f",
          400: "#bd9141",
          500: "#987131"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-display)", "ui-serif", "Georgia"]
      },
      boxShadow: {
        premium: "0 24px 80px -36px rgba(0, 0, 0, 0.85)",
        glass: "inset 0 1px 0 rgba(255,255,255,0.08), 0 30px 90px -50px rgba(0,0,0,0.9)",
        gold: "0 18px 70px -45px rgba(212, 175, 95, 0.75)"
      },
      backgroundImage: {
        "radial-gold": "radial-gradient(circle at 50% 0%, rgba(212,175,95,0.23), transparent 34rem)",
        "steel-fade": "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))"
      },
      keyframes: {
        "slow-float": {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -12px, 0)" }
        },
        "soft-pulse": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" }
        },
        "line-draw": {
          "0%": { transform: "scaleX(0)", opacity: "0" },
          "100%": { transform: "scaleX(1)", opacity: "1" }
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }
        }
      },
      animation: {
        "slow-float": "slow-float 7s ease-in-out infinite",
        "soft-pulse": "soft-pulse 4s ease-in-out infinite",
        "line-draw": "line-draw 1.2s ease-out both",
        "accordion-down": "accordion-down 0.28s ease-out",
        "accordion-up": "accordion-up 0.28s ease-out"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
