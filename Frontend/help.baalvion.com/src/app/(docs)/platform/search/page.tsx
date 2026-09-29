import type { Metadata } from 'next';
import { DocPage } from '@/components/docs/doc-page';
import { Callout } from '@/components/ui/callout';

const PATH = '/platform/search';

export const metadata: Metadata = {
  title: 'Search',
  description: 'How search works across trades, listings, and documents on Baalvion.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Search"
      description="How in-platform search finds trades, listings, and documents relevant to your role."
      toc={[
        { id: 'what-search-covers', text: 'What Search Covers' },
        { id: 'scoped-results', text: 'Scoped Results' },
        { id: 'search-tips', text: 'Search Tips' },
      ]}
    >
      <h2 id="what-search-covers">What Search Covers</h2>
      <p>
        Dashboard search looks across the records relevant to your role — orders and listings for buyers and
        sellers, tasks and assigned trades for trade agents. It is designed to get you directly to a specific
        record rather than to browse broadly.
      </p>

      <h2 id="scoped-results">Scoped Results</h2>
      <p>
        Search results are always scoped by the same permissions boundaries described in{' '}
        <a href="/platform/permissions">Permissions</a> — you will never see a result for a trade or record you
        don&rsquo;t have access to, regardless of how the query is phrased.
      </p>

      <Callout type="tip" title="Search by order or trade ID for exact matches">
        If you have an order or trade reference number, searching it directly is the fastest way to jump to the
        exact record instead of browsing lists.
      </Callout>

      <h2 id="search-tips">Search Tips</h2>
      <ul>
        <li>Use partial matches — full titles or IDs aren&rsquo;t required.</li>
        <li>Combine a counterparty name with a date range when looking for an older trade.</li>
        <li>Use the Help Center&rsquo;s own search (this site) separately for documentation, not platform data.</li>
      </ul>
    </DocPage>
  );
}
