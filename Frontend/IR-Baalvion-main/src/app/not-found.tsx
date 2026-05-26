import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-4">404</h1>
      <h2 className="text-xl font-semibold mb-6">Resource Not Found</h2>
      <p className="text-muted-foreground max-w-md mb-10">
        The corporate resource or document you are attempting to access does not exist or has been relocated within the governance framework.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Index
          </Link>
        </Button>
        <Button asChild>
          <Link href="/resources/contact-ir">Contact Relations</Link>
        </Button>
      </div>
    </div>
  );
}
