
import type { ReactNode } from 'react';

export default function ApiDocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background text-foreground">
      {children}
    </div>
  );
}
