import { Reveal } from '@/components/reveal';

export type Stat = {
  value: string;
  label: string;
  note?: string;
};

type StatGridProps = {
  stats: Stat[];
};

export function StatGrid({ stats }: StatGridProps) {
  return (
    <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Reveal key={stat.label} delay={index * 60}>
          <div className="glass-panel h-full p-6">
            <p className="font-display text-3xl font-semibold text-gradient sm:text-4xl">{stat.value}</p>
            <p className="mt-2 text-sm font-medium text-foreground">{stat.label}</p>
            {stat.note ? <p className="mt-1 text-xs text-muted-2">{stat.note}</p> : null}
          </div>
        </Reveal>
      ))}
    </div>
  );
}
