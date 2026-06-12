import type { Metadata } from 'next';
import Link from 'next/link';
import { cmsGetBoard } from '@/lib/cms';
import BoardGrid from './BoardGrid';

// Read live from the central CMS on every request so console edits show immediately.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Board of Directors',
  description:
    "Meet Baalvion's Board of Directors — the governance leaders providing strategic oversight across finance, technology, and global trade infrastructure.",
  alternates: { canonical: '/governance/board-of-directors' },
  openGraph: {
    title: 'Baalvion Board of Directors',
    description:
      "Meet Baalvion's Board of Directors — strategic oversight across finance, technology, and global trade.",
    url: 'https://ir.baalvion.com/governance/board-of-directors',
    type: 'website',
  },
};

export default async function BoardOfDirectorsPage() {
  const members = await cmsGetBoard();

  return (
    <>
      <section className="bg-black text-white py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-bold text-primary tracking-widest mb-2">GOVERNANCE</p>
          <h1 className="text-4xl md:text-5xl font-bold">Board of Directors</h1>
        </div>
      </section>
      <section className="py-16 md:py-24 bg-white text-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Link href="#" className="text-sm text-gray-600 hover:underline">
              Click here to read about Baalvion's approach to Board diversity
            </Link>
          </div>

          <BoardGrid members={members} />
        </div>
      </section>
    </>
  );
}
