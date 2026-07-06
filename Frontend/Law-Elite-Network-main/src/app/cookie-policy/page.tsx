import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { Cookie, BarChart3, Megaphone, Settings } from 'lucide-react';

const LAST_UPDATED = 'July 5, 2026';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-4xl">

          <header className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-600 bg-blue-50 px-2 py-1 rounded">Privacy & Transparency</span>
            </div>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-3 leading-tight">
              Cookie Policy
            </h1>
            <p className="text-sm font-medium text-slate-500">Last updated: {LAST_UPDATED}</p>
          </header>

          <div className="border-l-4 border-blue-600 bg-slate-50 rounded-r-2xl p-8 mb-16">
            <p className="text-slate-700 leading-relaxed">
              Law Elite Network uses cookies and similar technologies to keep the site working reliably, to understand
              how our legal encyclopedia is used, and to support the advertising that keeps our journalism free to
              read. This policy explains what those cookies do and how you can control them.
            </p>
          </div>

          <section className="space-y-16">

            <Block icon={<Settings className="w-6 h-6 text-blue-600" />} title="Strictly Necessary Cookies">
              <p>
                These cookies are essential to the operation of the site and cannot be switched off in our systems.
                They support core functions such as page navigation, secure form submission on our{' '}
                <Link href="/contact-us" className="text-blue-600 hover:underline">Contact Us</Link> page, session
                security, and remembering basic accessibility preferences within a browsing session. Because they are
                required for the site to function, they do not require separate consent, though we still disclose
                them here for full transparency.
              </p>
            </Block>

            <Block icon={<BarChart3 className="w-6 h-6 text-blue-600" />} title="Analytics Cookies">
              <p>
                Analytics cookies help us understand which legal topics readers find most useful, how visitors move
                through our{' '}
                <Link href="/legal" className="text-blue-600 hover:underline">A-Z legal encyclopedia</Link>, and where
                our content or navigation is falling short. We use this aggregated, statistical information to improve
                article coverage and site structure — never to identify an individual reader personally. Analytics
                cookies are optional and can be limited using the controls described below.
              </p>
            </Block>

            <Block icon={<Megaphone className="w-6 h-6 text-blue-600" />} title="Advertising Cookies">
              <p>
                Advertising cookies are set by us or by third-party advertising partners to deliver relevant
                advertising and to measure the performance of that advertising. Some of these cookies may also support
                sponsored placements described in our{' '}
                <Link href="/affiliate-disclosure" className="text-blue-600 hover:underline">Affiliate Disclosure</Link>{' '}
                and{' '}
                <Link href="/sponsored-content-policy" className="text-blue-600 hover:underline">Sponsored Content Policy</Link>.
                Advertising cookies never affect which legal topics we cover or how we describe them editorially.
              </p>
            </Block>

            <Block icon={<Cookie className="w-6 h-6 text-blue-600" />} title="Managing Your Cookie Preferences">
              <p>
                Most browsers let you view, delete, and block cookies through their settings menu. Blocking all
                cookies may affect site functionality, including the ability to complete forms or stay signed in
                across pages. Because cookie controls vary by browser and device, we recommend consulting your
                browser&apos;s help documentation for exact steps.
              </p>
              <p>
                For details on how we collect, use, and safeguard personal information more broadly — including data
                collected through cookies — see our{' '}
                <Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link>. Questions
                about this Cookie Policy can be directed to{' '}
                <a href="mailto:privacy@lawelitenetwork.com" className="text-blue-600 hover:underline">privacy@lawelitenetwork.com</a>.
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
