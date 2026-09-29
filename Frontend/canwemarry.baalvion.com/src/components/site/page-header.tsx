import type { ReactNode } from 'react';
import { Container } from '@/components/ui';

export function PageHeader({ title, lead, actions }: { title: string; lead?: string; actions?: ReactNode }) {
  return (
    <div className="border-b border-line bg-surface">
      <Container className="py-10 sm:py-14">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="heading text-3xl sm:text-4xl">{title}</h1>
            {lead && <p className="mt-3 text-body leading-relaxed text-muted">{lead}</p>}
          </div>
          {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
        </div>
      </Container>
    </div>
  );
}
