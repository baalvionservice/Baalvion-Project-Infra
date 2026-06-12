import type { Metadata } from 'next';
import IrPage from '@/components/cms/IrPage';
import { irMetadata } from '@/lib/ir-metadata';

const SLUG = '/company/story';

export function generateMetadata(): Metadata {
  return irMetadata(SLUG);
}

export default function Page() {
  return <IrPage slug={SLUG} />;
}
