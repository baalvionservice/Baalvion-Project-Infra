import { Container } from '@/components/ui';
import { PageHeader } from '@/components/site/page-header';
import { SITE, BOUNDARIES } from '@/lib/site';
import { publicMetadata } from '@/lib/seo';
import Link from 'next/link';



export const metadata = publicMetadata({
  title: 'About CanWeMarry',
  description: 'Why CanWeMarry exists, how it is governed, and the limits it holds itself to.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title={`About ${SITE.name}`}
        lead="Why this platform exists, how it is governed, and the limits it holds itself to."
      />
      <Container width="prose" className="py-12">
        <div className="space-y-6 text-body leading-relaxed text-foreground">
          <p>
            People whose families or communities oppose their relationship are usually told to choose
            between two things they should not have to choose between. The advice available to them is
            either to give up, or to cut everyone off. Very little of it helps with the actual work of
            staying in a relationship and in a family at the same time.
          </p>
          <p>
            {SITE.name} exists for that middle ground. It is a place to set out what is happening, hear
            from people who have been through something similar, and reach mediators, counsellors and
            legal information when the situation calls for them.
          </p>

          <h2 id="boundaries" className="heading pt-4 text-2xl">The limits we hold to</h2>
          <p>
            A platform built around family conflict can become a weapon very easily. These constraints
            are built into how the software works, not just into what we ask people to do.
          </p>
          <ul className="space-y-3">
            {BOUNDARIES.isNot.map((line) => (
              <li key={line} className="flex gap-3">
                <span aria-hidden="true" className="mt-1.5 text-muted-2">—</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <h2 className="heading pt-4 text-2xl">Consent is structural</h2>
          <p>
            A case is about a relationship, so it necessarily touches people who have not agreed to be
            discussed on a website. You can invite someone to take part, but only if they already have
            an account and can answer for themselves. Until they accept, they appear to nobody — not to
            other participants, not to moderators, not to us. There is no field anywhere in the system
            for the name, address or photograph of someone who has not consented, so there is nothing
            to leak.
          </p>

          <h2 className="heading pt-4 text-2xl">Privacy defaults</h2>
          <p>
            Cases start private. Profiles start undiscoverable. Location is hidden unless you turn it
            on. Every one of those is a decision you make deliberately, rather than something you have
            to notice and undo.
          </p>

          <h2 className="heading pt-4 text-2xl">This is not emergency help</h2>
          <p>
            {SITE.name} cannot respond quickly and does not monitor cases in real time. If you are in
            danger, contact your local emergency number. The{' '}
            <Link href="/resources?category=SAFETY" className="focus-ring rounded-sm font-medium text-accent-strong underline underline-offset-2">
              safety section of the resource directory
            </Link>{' '}
            lists organisations that can.
          </p>
        </div>
      </Container>
    </>
  );
}