import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: '#020617', // Deep OLED black
        surface: {
          DEFAULT: '#0F172A',  // Slate 900
          elevated: '#1E293B', // Slate 800
        },
        border: '#334155',     // Slate 700
        text: {
          primary: '#F8FAFC',  // Slate 50
          muted: '#94A3B8',    // Slate 400
        },
        accent: {
          primary: '#06B6D4',   // Cyan 500
          secondary: '#0891B2', // Cyan 600
        },
        success: '#06B6D4',    // Cyan 500 — main accent
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['"Exo 2"', 'sans-serif'],
        display: ['Orbitron', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 20px -5px rgba(6, 182, 212, 0.5)',
        'glow-sm': '0 0 10px -2px rgba(6, 182, 212, 0.3)',
        terminal: '0 4px 20px -4px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(to right, #1E293B 1px, transparent 1px), linear-gradient(to bottom, #1E293B 1px, transparent 1px)',
        'dot-pattern': 'radial-gradient(#334155 1px, transparent 1px)',
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite alternate",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "glow-pulse": {
          "0%": { boxShadow: "0 0 20px rgba(6,182,212,0.1)" },
          "100%": { boxShadow: "0 0 40px rgba(6,182,212,0.3)" },
        },
      },
    },
  },
  plugins: [typography],
};
export default config;
