
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TriangleAlert } from 'lucide-react';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <Image 
            src="https://picsum.photos/seed/404-page/400/300"
            width={400}
            height={300}
            alt="Confused person looking at a map"
            className="mx-auto mb-8 rounded-lg"
            data-ai-hint="confused person map"
        />
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Page Not Found</h2>
        <p className="mt-4 text-muted-foreground">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-8">
          <Link href="/dashboard">
            <Button size="lg">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
