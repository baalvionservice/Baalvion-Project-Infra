import OutlineGenerator from '@/modules/content-engine/components/OutlineGenerator';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'AI Content Outline Tool',
  description: 'Use generative AI to structure your financial articles and discover high-impact SEO topics.',
});

/**
 * The AI Content Outline page.
 * This file is the authoritative entry point for the /outline route.
 */
export default function OutlinePage() {
  return (
    <div className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-6xl font-headline font-bold mb-6">Create Better Financial Content</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our AI Content Engine helps you identify gaps in financial knowledge and build structured outlines for maximum authority.
          </p>
        </div>
        <OutlineGenerator />
      </div>
    </div>
  );
}
