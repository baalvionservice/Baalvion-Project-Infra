import type { ReactNode } from 'react';
import AccessGate from '@/components/authz/AccessGate';

// Same gate as Audit Logs — this is the same security stream, split by property.
export default function LoginActivityLayout({ children }: { children: ReactNode }) {
  return <AccessGate section="Sign-in Activity">{children}</AccessGate>;
}
