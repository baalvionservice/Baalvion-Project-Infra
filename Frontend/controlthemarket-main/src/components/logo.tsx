import { Rocket } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Rocket className="h-6 w-6 text-primary" />
      <span className="font-headline text-xl font-bold text-foreground">
        ControlTheMarket
      </span>
    </Link>
  );
}
