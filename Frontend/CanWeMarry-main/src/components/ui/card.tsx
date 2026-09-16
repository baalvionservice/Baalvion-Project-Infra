import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from './cn';

export interface CardProps {
  children: ReactNode;
  className?: string;
  /** Turns the whole card into a link. The heading stays the accessible name. */
  href?: string;
}

export function Card({ children, className, href }: CardProps) {
  const base = cn('rounded-card border border-line bg-surface shadow-card', className);
  if (!href) return <div className={base}>{children}</div>;
  return (
    <Link href={href} className={cn(base, 'focus-ring block transition-shadow hover:shadow-lift')}>
      {children}
    </Link>
  );
}

export const CardHeader = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('border-b border-line px-5 py-4', className)}>{children}</div>
);

export const CardBody = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('px-5 py-4', className)}>{children}</div>
);

export const CardFooter = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('border-t border-line px-5 py-3', className)}>{children}</div>
);

/**
 * A card's heading. The level is explicit because heading order is a document property, not
 * a component one: the same card is an h3 inside a titled section and an h2 when the grid
 * sits directly under the page title. Defaulting to h3 and letting the page say otherwise
 * keeps screen-reader navigation coherent.
 */
export const CardTitle = ({
  children, className, as: Heading = 'h3',
}: { children: ReactNode; className?: string; as?: 'h2' | 'h3' | 'h4' }) => (
  <Heading className={cn('heading text-lg', className)}>{children}</Heading>
);
