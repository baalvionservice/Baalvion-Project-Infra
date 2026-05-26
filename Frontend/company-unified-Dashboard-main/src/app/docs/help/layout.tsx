
import type { ReactNode } from 'react';

export default function HelpDocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background text-foreground">
      {children}
    </div>
  );
}
