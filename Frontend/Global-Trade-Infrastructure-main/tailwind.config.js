/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "monospace"],
        // World Shipping Directory only. BlackRock sets its sites in BLK Fort, a
        // commissioned cut of Displaay's "Fort" that is licensed to them and served from
        // their own CDN — it cannot be used here. Archivo is the closest open grotesque:
        // same high x-height, same tight apertures, same flat terminals, and it ships a
        // true narrow companion for the condensed data labels BLK Fort Condensed carries.
        blk: ["var(--font-blk)", "Archivo", "Helvetica Neue", "Arial", "sans-serif"],
        "blk-cond": ["var(--font-blk-cond)", "Archivo Narrow", "Arial Narrow", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Semantic Financial Aliases
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        info: "hsl(var(--info))",
        gold: {
          DEFAULT: "hsl(var(--gold))",
          foreground: "hsl(var(--gold-foreground))",
        },
        // World Shipping Directory palette, read off careers.blackrock.com's own
        // stylesheet: --base-color #6F00EF plus the vermilion/yellow/pink accents it
        // pairs with, on a white ground with near-black type. The directory is a separate
        // public property on its own subdomain, so it does not inherit the dark
        // Baalvion OS chrome and needs its own scale rather than the shadcn tokens.
        wsd: {
          black: "#000000",
          ink: "#141414",
          body: "#252525",
          muted: "#767676",
          line: "#c2c2c2",
          "line-soft": "#e4e4e4",
          ground: "#ffffff",
          "ground-alt": "#f7f7f7",
          "ground-mid": "#efefef",
          violet: "#6f00ef",
          "violet-deep": "#4b00a3",
          "violet-wash": "#f3ebff",
          vermilion: "#ff4713",
          yellow: "#ffce00",
          pink: "#fc9bb3",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        // 8px Base Grid Integration
        '4.5': '1.125rem',
        '18': '4.5rem',
      },
      boxShadow: {
        'lvl-1': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'lvl-2': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.05)',
        'lvl-3': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}