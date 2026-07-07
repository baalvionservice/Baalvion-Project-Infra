import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PageHero } from '@/components/ui/page-hero';
import { RoleSolution } from '@/components/sections/role-solution';
import { SOLUTIONS_CONTENT } from '@/lib/solutions-content';

const content = SOLUTIONS_CONTENT.sellers;

export const metadata: Metadata = {
  title: 'Solutions for Sellers',
  description: content.heroDescription,
};

export default function SellersSolutionsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <PageHero eyebrow={content.heroEyebrow} title={content.heroTitle} description={content.heroDescription} />
        <RoleSolution content={content} />
      </main>
      <SiteFooter />
    </>
  );
}
