import type {Config} from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          green: '#39FF14',
          'green-dim': '#1A7A0A',
          void: '#000000',
          base: '#0B0C0F',
          surface: '#111318',
          elevated: '#181B21',
          overlay: '#1F232B',
          border: '#252A33',
          highlight: '#2A3040',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#C8CDD8',
          muted: '#6B7280',
          ghost: '#3D4450',
        },
        semantic: {
          success: '#39FF14',
          error: '#EF4444',
          warning: '#F59E0B',
          info: '#3B82F6',
          crypto: '#F7931A',
        }
      },
      borderRadius: {
        lg: '8px',
        md: '6px',
        sm: '4px',
      },
      animation: {
        'cursor-blink': 'cursor-blink 1s step-end infinite',
        'ticker': 'ticker 30s linear infinite',
      },
      keyframes: {
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'ticker': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
