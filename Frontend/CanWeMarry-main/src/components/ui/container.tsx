import type { ReactNode } from 'react';
import { cn } from './cn';

export interface ContainerProps {
  children: ReactNode;
  className?: string;
  /** `prose` narrows to a comfortable reading measure for long-form text. */
  width?: 'site' | 'prose';
  as?: 'div' | 'section' | 'main' | 'article';
}

export function Container({ children, className, width = 'site', as: Tag = 'div' }: ContainerProps) {
  return (
    <Tag className={cn(width === 'prose' ? 'mx-auto w-full max-w-prose px-5 sm:px-6' : 'container-site', className)}>
      {children}
    </Tag>
  );
}
