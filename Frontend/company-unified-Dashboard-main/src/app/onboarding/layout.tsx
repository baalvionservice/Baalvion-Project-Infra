
import type { ReactNode } from 'react';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4 sm:p-6 lg:p-8">
      {children}
    </div>
  );
}
