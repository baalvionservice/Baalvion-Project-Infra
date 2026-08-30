import React from 'react';
import Link from 'next/link';
import { getRelatedHubs } from '@/lib/internal-links';
import { TipBox } from '@/components/common/TipBox';

/**
 * Renders a list of internal links to related hub pages.
 * `hub` is the current hub slug (e.g. "stocks").
 */
export const InternalLinkList: React.FC<{ hub: string }> = ({ hub }) => {
  const related = getRelatedHubs(hub);
  return (
    <section className="my-8">
      <h2 className="text-xl font-semibold mb-4">Related Topics</h2>
      <ul className="list-disc list-inside space-y-2">
        {related.map((slug) => (
          <li key={slug}>
            <Link href={`/${slug}`} className="text-indigo-600 hover:underline">
              {slug.replace(/-/g, ' ')}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default InternalLinkList;
