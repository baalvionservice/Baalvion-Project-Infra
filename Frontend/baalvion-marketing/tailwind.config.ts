import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ground: 'hsl(var(--ground))',
        surface: 'hsl(var(--surface))',
        'surface-2': 'hsl(var(--surface-2))',
        'surface-3': 'hsl(var(--surface-3))',
        line: 'hsl(var(--line))',
        'line-strong': 'hsl(var(--line-strong))',
        foreground: 'hsl(var(--foreground))',
        muted: 'hsl(var(--muted))',
        'muted-2': 'hsl(var(--muted-2))',
        iris: 'hsl(var(--iris))',
        cyan: 'hsl(var(--cyan))',
        amber: 'hsl(var(--amber))',
        'on-accent': 'hsl(var(--on-accent))',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-text)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SF Mono', 'monospace'],
      },
      maxWidth: {
        site: 'var(--container)',
      },
      backgroundImage: {
        'grid-fade':
          'linear-gradient(hsl(var(--line)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--line)) 1px, transparent 1px)',
        'mesh-hero':
          'radial-gradient(60% 50% at 15% 10%, hsl(var(--iris) / 0.35), transparent), radial-gradient(50% 45% at 90% 0%, hsl(var(--cyan) / 0.28), transparent), radial-gradient(70% 60% at 50% 100%, hsl(var(--amber) / 0.12), transparent)',
        'iris-cyan': 'linear-gradient(115deg, hsl(var(--iris)), hsl(var(--cyan)))',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      boxShadow: {
        glass: '0 1px 0 0 hsl(var(--line-strong)) inset, 0 24px 60px -24px hsl(220 60% 2% / 0.65)',
      },
    },
  },
  plugins: [],
};

export default config;
