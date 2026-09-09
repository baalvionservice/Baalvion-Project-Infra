import type { Config } from 'tailwindcss';

export default {
  presets: [require('@baalvion/design/tailwind')],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'hsl(var(--ink))',
        paper: 'hsl(var(--paper))',
        'paper-alt': 'hsl(var(--paper-alt))',
        'muted-ink': 'hsl(var(--muted-ink))',
        line: 'hsl(var(--line))',
        accent: 'hsl(var(--accent))',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
