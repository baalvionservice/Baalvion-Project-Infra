import tailwindcssAnimate from "tailwindcss-animate";
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          soft: 'hsl(var(--primary-soft))',
        },
        // The reference site's own four accents, used as solid blocks.
        brand: {
          orange: 'hsl(var(--brand-orange))',
          yellow: 'hsl(var(--brand-yellow))',
          pink: 'hsl(var(--brand-pink))',
          purple: 'hsl(var(--brand-purple))',
          blue: 'hsl(var(--brand-blue))',
        },
        // One hue per business unit, so a 350-role list can be grouped by eye. `-bar`
        // keeps full brightness for the colour rule; the plain name is darkened enough
        // to stay legible as 14px text.
        unit: {
          technology: 'hsl(var(--unit-technology))',
          mining: 'hsl(var(--unit-mining))',
          media: 'hsl(var(--unit-media))',
          growth: 'hsl(var(--unit-growth))',
          customer: 'hsl(var(--unit-customer))',
          operations: 'hsl(var(--unit-operations))',
          corporate: 'hsl(var(--unit-corporate))',
          people: 'hsl(var(--unit-people))',
          'technology-bar': 'hsl(var(--unit-technology-bar))',
          'mining-bar': 'hsl(var(--unit-mining-bar))',
          'media-bar': 'hsl(var(--unit-media-bar))',
          'growth-bar': 'hsl(var(--unit-growth-bar))',
          'customer-bar': 'hsl(var(--unit-customer-bar))',
          'operations-bar': 'hsl(var(--unit-operations-bar))',
          'corporate-bar': 'hsl(var(--unit-corporate-bar))',
          'people-bar': 'hsl(var(--unit-people-bar))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        xxl: "48px",
      },
      fontSize: {
        h1: ['48px', { lineHeight: '56px', fontWeight: '700' }],
        h2: ['36px', { lineHeight: '44px', fontWeight: '600' }],
        h3: ['28px', { lineHeight: '36px', fontWeight: '600' }],
        h4: ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'body-large': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-regular': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-small': ['14px', { lineHeight: '20px', fontWeight: '400' }],
      },
      borderRadius: {
        /* shadcn's primitives all use rounded-lg / -md / -sm, which were falling through
           to Tailwind's 8px default and giving every card and button consumer-app
           corners. Bind them to the token so the whole UI tightens at once. */
        lg: "var(--radius)",
        md: "calc(var(--radius) - 1px)",
        sm: "calc(var(--radius) - 2px)",
        small: "2px",
        medium: "3px",
        large: "6px",
      },
      /* Borders do the separating; shadows are a whisper, not a lift. */
      boxShadow: {
        'level-1': '0 1px 2px rgba(0,0,0,0.04)',
        'level-2': '0 2px 6px rgba(0,0,0,0.06)',
        'level-3': '0 8px 24px rgba(0,0,0,0.08)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'global-loading': {
          '0%': { transform: 'translateX(-100%) scaleX(0.1)', opacity: '0.8' },
          '50%': { transform: 'translateX(0%) scaleX(0.4)', opacity: '1' },
          '100%': { transform: 'translateX(100%) scaleX(0.1)', opacity: '0.8' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'global-loading': 'global-loading 1.5s infinite ease-in-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config
