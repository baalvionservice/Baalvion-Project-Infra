import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { Building2, Users, ShieldCheck, Mail } from 'lucide-react';

const LAST_UPDATED = 'July 5, 2026';

export default function OwnershipDisclosurePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-4xl">

          <header className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-600 bg-blue-50 px-2 py-1 rounded">Editorial Integrity</span>
            </div>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-3 leading-tight">
              Ownership Disclosure
            </h1>
            <p className="text-sm font-medium text-slate-500">Last updated: {LAST_UPDATED}</p>
          </header>

          <div className="border-l-4 border-blue-600 bg-slate-50 rounded-r-2xl p-8 mb-16">
            <p className="text-slate-700 leading-relaxed">
              Readers evaluating legal information and lawyer referrals deserve to know who stands behind the
              publication. This page discloses who operates Law Elite Network and who is legally responsible for its
              content and its lawyer-matching service.
            </p>
          </div>

          <section className="space-y-16">

            <Block icon={<Building2 className="w-6 h-6 text-blue-600" />} title="Who Operates This Site">
              <p>
                Law Elite Network is operated by{' '}
                <span className="font-medium text-slate-900">
                  Baalvion Industries Private Limited, headquartered at Yeshwant Avenue Building,
                  NX, NX Road, Y K Nagar, Virar West, Virar, Maharashtra 401303, India
                </span>
                .
                This entity is the publisher of the editorial content on this site and the operator of the lawyer
                directory and matching features found at{' '}
                <Link href="/lawyers" className="text-blue-600 hover:underline">/lawyers</Link> and{' '}
                <Link href="/appointments" className="text-blue-600 hover:underline">/appointments</Link>.
              </p>
            </Block>

            <Block icon={<Users className="w-6 h-6 text-blue-600" />} title="Who Is Responsible">
              <p>
                The operating entity identified above is legally responsible for the accuracy and publication of
                content on Law Elite Network and for the operation of the lawyer-matching service. Editorial
                decisions — what we cover, how we describe legal topics, and which lawyers meet our verification bar
                — are made under our{' '}
                <Link href="/editorial-standards" className="text-blue-600 hover:underline">Editorial Standards</Link>{' '}
                and{' '}
                <Link href="/editorial-process" className="text-blue-600 hover:underline">Editorial Process</Link>,
                independent of any single reader, advertiser, or listed lawyer.
              </p>
            </Block>

            <Block icon={<ShieldCheck className="w-6 h-6 text-blue-600" />} title="No Undisclosed Outside Influence">
              <p>
                We do not maintain an undisclosed ownership stake, investment, or business relationship that
                influences our editorial coverage or which lawyers are matched to readers. Where a commercial
                relationship does exist — such as a referral arrangement or sponsored placement — it is disclosed
                separately in our{' '}
                <Link href="/affiliate-disclosure" className="text-blue-600 hover:underline">Affiliate Disclosure</Link>{' '}
                and{' '}
                <Link href="/conflict-of-interest-policy" className="text-blue-600 hover:underline">Conflict of Interest Policy</Link>,
                and never overrides our editorial judgment.
              </p>
            </Block>

            <Block icon={<Mail className="w-6 h-6 text-blue-600" />} title="Questions About Ownership">
              <p>
                If you have questions about who operates Law Elite Network or how the site is structured, contact us
                at{' '}
                <a href="mailto:legal@lawelitenetwork.com" className="text-blue-600 hover:underline">legal@lawelitenetwork.com</a>{' '}
                or through our{' '}
                <Link href="/about-us" className="text-blue-600 hover:underline">About Us</Link> page.
              </p>
            </Block>

          </section>

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
        <h2 className="text-[28px] font-bold text-slate-900 font-serif leading-tight">{title}</h2>
      </div>
      <div className="prose-legal max-w-none text-slate-700 leading-relaxed space-y-4 pl-14">{children}</div>
    </div>
  );
}
