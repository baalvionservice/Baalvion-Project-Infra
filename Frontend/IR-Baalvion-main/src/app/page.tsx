'use client';

import { useEffect, useState, useMemo } from 'react';
import { pageService } from '@/core/services/page.service';
import { authService } from '@/core/services/auth.service';
import { PageDefinition, UserRole } from '@/core/content/schemas';
import PageRenderer from '@/components/cms/PageRenderer';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Landmark, Globe } from 'lucide-react';

export default function Home() {
  const [pageData, setPageData] = useState<PageDefinition | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('public');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const loadPage = async () => {
      const { role } = await authService.getCurrentUser();
      if (mounted) setUserRole(role);

      const response = await pageService.getPageBySlug('/');
      if (!mounted) return;

      if (response.success && response.data) {
        setPageData(response.data);
      } else if (!response.success) {
        toast({
          variant: "destructive",
          title: "System Connection Error",
          description: "Unable to reach institutional content registry."
        });
      }
      setIsLoading(false);
    };

    loadPage();
    window.addEventListener('storage', loadPage);

    return () => {
      mounted = false;
      window.removeEventListener('storage', loadPage);
    };
  }, [toast]);

  const renderedContent = useMemo(() => {
    if (isLoading) {
      return (
        <div className="space-y-12 py-20 px-4 container mx-auto">
          <Skeleton className="h-[500px] w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      );
    }

    if (!pageData) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center gap-6 px-4">
          <div className="p-4 bg-primary/10 rounded-full">
            <ShieldCheck className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Access Restricted</h1>
          <p className="text-muted-foreground max-w-md">
            Your current institutional classification does not permit viewing the primary index.
            Please complete onboarding or contact your relationship manager.
          </p>
          <div className="flex gap-4">
            <Button asChild size="lg">
              <Link href="/onboarding">Apply for Access</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/resources/contact-ir">Contact IR</Link>
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="animate-in fade-in duration-1000">
        {userRole !== 'public' && (
          <div className="bg-primary/10 border-b border-primary/20 py-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Institutional Session Active: {userRole}
          </div>
        )}
        <PageRenderer page={pageData} />
      </div>
    );
  }, [isLoading, pageData, userRole]);

  return (
    <main className="w-full max-w-6xl mx-auto px-1 sm:px-6 lg:px-8">
      {renderedContent}
    </main>
  );
}
