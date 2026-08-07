import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { Building2, Gavel, Copyright, FileWarning, Handshake, Mail } from 'lucide-react';

const LAST_UPDATED = 'July 30, 2026';

export const metadata: Metadata = {
  title: 'Editorial, DMCA & Disclosure Policy',
  description:
    'How Law Elite Network sources and attributes legal information, who owns and operates the site, our copyright and DMCA takedown process, and how advertising and referral compensation is disclosed.',
  alternates: { canonical: '/editorial-disclosure-policy' },
};

export default function EditorialDisclosurePolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-4xl">

          <header className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-600 bg-blue-50 px-2 py-1 rounded">Legal & Compliance</span>
            </div>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-3 leading-tight">
              Editorial, DMCA &amp; Disclosure Policy
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Last updated: {LAST_UPDATED} · Replaces the former Source Attribution Policy, Ownership Disclosure, DMCA
              Policy, Copyright Policy, and Affiliate Disclosure pages, consolidated here without dropping any of
              their substance.
            </p>
          </header>

          <div className="border-l-4 border-blue-600 bg-slate-50 rounded-r-2xl p-8 mb-16">
            <p className="text-slate-700 leading-relaxed">
              This page explains four things together, because a reader evaluating our trustworthiness usually wants
              all four at once: where our information comes from, who is legally behind this publication, what you
              may do with our content, and how we make money from it.
            </p>
          </div>

          <section className="space-y-16">

            <Block icon={<Gavel className="w-6 h-6 text-blue-600" />} title="1. Source Attribution">
              <p>
                Primary legal sources — statutes, regulations, case law, court filings, and regulatory guidance — are
                cited directly and, where possible, linked to the official or authoritative publication of that
                source. Our own explanations, summaries, and analysis of those sources are secondary commentary: our
                interpretation of what a primary source means and why it matters. We aim to make it clear, within an
                article, which sentences describe what the law says and which are our editorial interpretation of it.
              </p>
              <p>
                We prioritize official government sources — courts, legislatures, and regulatory agencies — over
                secondary aggregators when citing the underlying law. Where we rely on secondary legal databases or
                commentary, we prefer sources with a track record of accuracy, and per our{' '}
                <Link href="/editorial-process" className="text-blue-600 hover:underline">Editorial Process</Link>,
                subject significant claims to review before publication.
              </p>
              <p>
                Law is not static: it varies by jurisdiction and changes over time. Every article displays when it was
                last substantively reviewed, and a citation to a statute or case is only as current as that date.
                Readers relying on time-sensitive legal information should confirm the current state of the law in
                their jurisdiction. See our{' '}
                <Link href="/corrections" className="text-blue-600 hover:underline">Corrections</Link> page for how
                we handle updates when the underlying law changes. Careful sourcing does not make our content a
                substitute for retaining counsel — see our{' '}
                <Link href="/terms-of-service" className="text-blue-600 hover:underline">Terms of Service</Link> for
                the full scope of that distinction.
              </p>
            </Block>

            <Block icon={<Building2 className="w-6 h-6 text-blue-600" />} title="2. Ownership &amp; Editorial Independence">
              <p>
                Law Elite Network is operated by{' '}
                <span className="font-medium text-slate-900">
                  Baalvion Industries Private Limited, headquartered at Yeshwant Avenue Building, NX, NX Road, Y K
                  Nagar, Virar West, Virar, Maharashtra 401303, India
                </span>
                . This entity is the publisher of the editorial content on this site and the operator of the lawyer
                directory and matching features found at{' '}
                <Link href="/lawyers" className="text-blue-600 hover:underline">/lawyers</Link> and{' '}
                <Link href="/appointments" className="text-blue-600 hover:underline">/appointments</Link>.
              </p>
              <p>
                Editorial decisions — what we cover, how we describe legal topics, and which lawyers meet our
                verification bar — are made under our{' '}
                <Link href="/editorial-standards" className="text-blue-600 hover:underline">Editorial Standards</Link>{' '}
                and{' '}
                <Link href="/editorial-process" className="text-blue-600 hover:underline">Editorial Process</Link>,
                independent of any single reader, advertiser, or listed lawyer. We do not maintain an undisclosed
                ownership stake, investment, or business relationship that influences our editorial coverage or which
                lawyers are matched to readers — where a commercial relationship exists, it is disclosed in Section 4
                below and never overrides editorial judgment. See also our{' '}
                <Link href="/conflict-of-interest-policy" className="text-blue-600 hover:underline">Conflict of Interest Policy</Link>.
              </p>
            </Block>

            <Block icon={<Copyright className="w-6 h-6 text-blue-600" />} title="3. Copyright &amp; DMCA">
              <p>
                The original text on Law Elite Network — case summaries, legal explainers, editorial commentary,
                illustrations, and site design — is owned by Law Elite Network or licensed to us by our contributors.
                Statutes, regulations, and judicial opinions are generally public domain and not owned by anyone,
                including us; what is protected is our original analysis — the summary we write, the plain-language
                explanation, the structure and selection of information. Reproducing the underlying public-domain law
                is not a copyright concern; reproducing our original write-up of it, without permission, is.
              </p>
              <p>
                Readers, journalists, and researchers may quote brief excerpts of our original content for commentary,
                criticism, or reference, provided the excerpt is reasonably short, clearly attributed, and links back
                to the original page. Not permitted without a license: automated scraping or bulk downloading,
                mirroring substantial portions of our encyclopedia elsewhere, republishing full articles under a
                different byline, or using our content to train another product's dataset. To license or republish
                content beyond this, email{' '}
                <a href="mailto:permissions@lawelitenetwork.com" className="text-blue-600 hover:underline">permissions@lawelitenetwork.com</a>.
              </p>
              <p>
                If you believe content on this site infringes a copyright you hold, send a written notice to our
                designated agent at{' '}
                <a href="mailto:dmca@lawelitenetwork.com" className="text-blue-600 hover:underline">dmca@lawelitenetwork.com</a>{' '}
                identifying: (a) the copyrighted work claimed to be infringed; (b) the specific URL of the material you
                claim is infringing; (c) your contact information; and (d) a good-faith statement that the use is not
                authorized by the copyright owner, its agent, or the law, made under penalty of perjury. We
                investigate every properly documented notice and remove or restrict access to infringing material
                where warranted, and follow the counter-notification timelines set out in 17 U.S.C. § 512(g) before
                deciding whether to restore removed material. Our designated agent's full mailing address:
              </p>
              <p className="font-medium text-slate-900">
                Copyright Compliance Officer, Legal Department, Baalvion Industries Private Limited — Yeshwant Avenue
                Building, NX, NX Road, Y K Nagar, Virar West, Virar, Maharashtra 401303, India
              </p>
              <p>
                Consistent with the DMCA, we maintain a policy of terminating, in appropriate circumstances, the
                accounts of contributors or users determined to be repeat infringers.
              </p>
            </Block>

            <Block icon={<Handshake className="w-6 h-6 text-blue-600" />} title="4. Advertising, Affiliate &amp; Referral Disclosure">
              <p>
                Law Elite Network is supported in part by advertising, including ads served through Google AdSense.
                Some outbound links, and some placements within our{' '}
                <Link href="/lawyers" className="text-blue-600 hover:underline">lawyer directory</Link>, may also be
                compensated — for example, a referral arrangement where a lawyer or firm pays a fee when a reader is
                connected to them through our{' '}
                <Link href="/appointments" className="text-blue-600 hover:underline">Appointments</Link> flow, or a
                paid promotional placement described on our{' '}
                <Link href="/advertise" className="text-blue-600 hover:underline">Advertise</Link> page. Where a link
                or listing involves compensation, we aim to make that clear in context.
              </p>
              <p>
                Compensation never influences which lawyers we designate as &quot;Verified,&quot; how we describe a
                legal topic, or the conclusions in our editorial coverage — verification and editorial judgments are
                governed separately by our{' '}
                <Link href="/editorial-standards" className="text-blue-600 hover:underline">Editorial Standards</Link>
                {' '}and applied identically to paying and non-paying listings. A lawyer's participation in a referral
                arrangement is a business relationship, not an editorial endorsement. This is distinct from, and
                complements, our{' '}
                <Link href="/sponsored-content-policy" className="text-blue-600 hover:underline">Sponsored Content Policy</Link>,
                which governs paid articles and featured posts rather than referral links. See our{' '}
                <Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link> for how
                advertising partners use cookies and other tracking technologies.
              </p>
            </Block>

            <Block icon={<FileWarning className="w-6 h-6 text-blue-600" />} title="5. Questions">
              <p>
                For copyright notices: <a href="mailto:dmca@lawelitenetwork.com" className="text-blue-600 hover:underline">dmca@lawelitenetwork.com</a>.
                For permissions and licensing: <a href="mailto:permissions@lawelitenetwork.com" className="text-blue-600 hover:underline">permissions@lawelitenetwork.com</a>.
                For advertising and referral relationships: <a href="mailto:advertise@lawelitenetwork.com" className="text-blue-600 hover:underline">advertise@lawelitenetwork.com</a>.
                For anything about ownership or how the site is structured:{' '}
                <a href="mailto:legal@lawelitenetwork.com" className="text-blue-600 hover:underline">legal@lawelitenetwork.com</a>{' '}
                or our{' '}
                <Link href="/about-us" className="text-blue-600 hover:underline">About Us</Link> page.
              </p>
            </Block>

          </section>

          <div className="mt-16 flex items-center gap-3 text-slate-400">
            <Mail className="w-4 h-4" />
            <p className="text-xs">
              General inquiries can always be routed through{' '}
              <Link href="/contact-us" className="text-blue-600 hover:underline">Contact Us</Link>.
            </p>
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function Block({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 scroll-mt-32">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">{icon}</div>
        <h2 className="text-[22px] md:text-[28px] font-bold text-slate-900 font-serif leading-tight">{title}</h2>
      </div>
      <div className="prose-legal max-w-none text-slate-700 leading-relaxed space-y-4 pl-14">{children}</div>
    </div>
  );
}
