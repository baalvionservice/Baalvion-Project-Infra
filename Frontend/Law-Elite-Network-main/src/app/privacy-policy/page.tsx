"use client";

import React, { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { List, ShieldCheck, Lock } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const LAST_UPDATED = 'June 30, 2026';

export default function PrivacyPolicyPage() {
  const [isExpanded, setIsExpanded] = useState(true);

  const tocLinks = [
    { label: "Information We Collect", id: "collection" },
    { label: "How We Use Information", id: "usage" },
    { label: "Cookies & Tracking Technologies", id: "cookies" },
    { label: "Advertising & Google AdSense", id: "advertising" },
    { label: "Third-Party Disclosures", id: "third-party" },
    { label: "Data Security Protocols", id: "security" },
    { label: "Your Privacy Rights", id: "rights" },
    { label: "International Data Transfers", id: "international" },
    { label: "Children's Privacy", id: "children" },
    { label: "Changes to This Policy", id: "changes" },
    { label: "Contact Privacy Team", id: "contact-privacy" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-4xl">

          <header className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-600 bg-blue-50 px-2 py-1 rounded">Compliance Dossier</span>
            </div>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-3 leading-tight">
              Privacy Policy
            </h1>
            <p className="text-sm font-medium text-slate-500 mb-10">Last updated: {LAST_UPDATED}</p>

            <div className="relative border border-slate-200 p-8 pt-6 rounded-none bg-slate-50/30">
              <div className="flex items-center gap-2 mb-6">
                <List className="w-4 h-4 text-blue-600" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900">Table of Contents</span>
              </div>

              {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 animate-in fade-in duration-300">
                  {tocLinks.map((link) => (
                    <div key={link.id} className="flex items-start gap-2 group">
                      <CoralArrow className="mt-1 shrink-0" />
                      <Link
                        href={`#${link.id}`}
                        className="text-[15px] font-medium text-slate-800 hover:text-blue-600 underline decoration-slate-200 hover:decoration-blue-600 decoration-1 underline-offset-4 transition-all"
                      >
                        {link.label}
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#a3a3a3] hover:bg-slate-600 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-sm transition-all shadow-sm"
              >
                {isExpanded ? 'Close -' : 'Expand +'}
              </button>
            </div>
          </header>

          <section className="space-y-16">

            <Block id="collection" title="Information We Collect">
              <p>Law Elite Network (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects information to operate and improve our legal knowledge and practitioner-discovery platform at lawelitenetwork.com. We collect:</p>
              <ul>
                <li><strong>Information you provide:</strong> name, email address, and account details when you register, subscribe to our newsletter, contact us, or request a consultation.</li>
                <li><strong>Information collected automatically:</strong> IP address, browser type, device identifiers, pages visited, referring URLs, and time spent on pages, gathered through cookies and analytics tools.</li>
                <li><strong>Usage data:</strong> search queries, articles read, and interactions used to improve content relevance.</li>
              </ul>
              <p>We collect only the data reasonably necessary to deliver our services and comply with legal obligations.</p>
            </Block>

            <Block id="usage" title="How We Use Information">
              <p>We use the information we collect to:</p>
              <ul>
                <li>Operate, maintain, and improve the website and its content;</li>
                <li>Respond to inquiries and provide customer support;</li>
                <li>Send newsletters and updates where you have opted in;</li>
                <li>Analyze traffic and usage patterns to improve our editorial coverage;</li>
                <li>Display relevant advertising through third-party advertising partners;</li>
                <li>Detect, prevent, and address fraud, abuse, and security issues;</li>
                <li>Comply with applicable legal and regulatory requirements.</li>
              </ul>
              <p>We do not sell your personal information.</p>
            </Block>

            <Block id="cookies" title="Cookies & Tracking Technologies">
              <p>Cookies are small text files stored on your device. We and our partners use cookies and similar technologies to remember your preferences, measure site performance, understand how visitors use the site, and serve advertising.</p>
              <p>We use the following categories of cookies:</p>
              <ul>
                <li><strong>Essential cookies</strong> — required for core site functionality and security.</li>
                <li><strong>Analytics cookies</strong> — help us understand traffic and improve content (e.g., Google Analytics).</li>
                <li><strong>Advertising cookies</strong> — used by third-party vendors, including Google, to serve and measure ads.</li>
              </ul>
              <p>You can control or disable cookies through your browser settings. Disabling certain cookies may affect site functionality. Where required by law, we request your consent before placing non-essential cookies via our cookie-consent banner.</p>
            </Block>

            <Block id="advertising" title="Advertising & Google AdSense">
              <p>This website displays advertising served by third-party advertising networks, including <strong>Google AdSense</strong>. These partners help fund our free legal content.</p>
              <ul>
                <li>Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s prior visits to this website and other websites.</li>
                <li>Google&apos;s use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the Internet.</li>
                <li>You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</li>
                <li>You can opt out of a third-party vendor&apos;s use of cookies for personalized advertising by visiting <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">www.aboutads.info</a>.</li>
                <li>Third-party networks operating on this site may also place and read cookies on your browser or use web beacons to collect information in the course of ads being served. For more information, see <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">How Google uses information from sites that use its services</a>.</li>
              </ul>
              <p>We do not control the cookies used by third-party advertisers and recommend reviewing their respective privacy policies.</p>
            </Block>

            <Block id="third-party" title="Third-Party Disclosures">
              <p>We may share information with trusted third parties only as needed to operate our services:</p>
              <ul>
                <li><strong>Service providers</strong> who perform hosting, analytics, email delivery, and payment processing on our behalf;</li>
                <li><strong>Advertising and measurement partners</strong> as described in the Advertising section above;</li>
                <li><strong>Legal and regulatory authorities</strong> where disclosure is required by law or to protect our rights, users, or the public.</li>
              </ul>
              <p>We do not sell, rent, or trade your personal information to third parties for their own marketing purposes.</p>
            </Block>

            <Block id="security" title="Data Security Protocols">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
                <div className="p-6 rounded-2xl bg-blue-600 text-white shadow-xl flex items-start gap-4">
                  <Lock className="w-6 h-6 shrink-0" />
                  <div>
                    <h4 className="font-bold mb-1">Encryption in Transit</h4>
                    <p className="text-xs text-blue-100 italic">All connections are secured via TLS, and sensitive data is encrypted at rest.</p>
                  </div>
                </div>
                <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-start gap-4">
                  <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Access Controls & Audits</h4>
                    <p className="text-xs text-slate-500 italic">Access is restricted on a least-privilege basis with regular security reviews.</p>
                  </div>
                </div>
              </div>
              <p>No method of transmission or storage is completely secure. While we use commercially reasonable safeguards, we cannot guarantee absolute security.</p>
            </Block>

            <Block id="rights" title="Your Privacy Rights">
              <p>Depending on your location, you may have the right to:</p>
              <ul>
                <li>Access the personal information we hold about you;</li>
                <li>Request correction or deletion of your personal information;</li>
                <li>Object to or restrict certain processing;</li>
                <li>Withdraw consent where processing is based on consent;</li>
                <li>Opt out of personalized advertising and marketing communications.</li>
              </ul>
              <p>Residents of the EU/EEA and UK have rights under the GDPR; California residents have rights under the CCPA/CPRA, including the right to opt out of the &quot;sale&quot; or &quot;sharing&quot; of personal information. To exercise any right, contact us at <a href="mailto:legal@lawelitenetwork.com">legal@lawelitenetwork.com</a>.</p>
            </Block>

            <Block id="international" title="International Data Transfers">
              <p>We operate globally, and your information may be processed in countries other than your own, including jurisdictions whose data-protection laws differ from those in your country. Where required, we implement appropriate safeguards (such as Standard Contractual Clauses) for cross-border transfers.</p>
            </Block>

            <Block id="children" title="Children's Privacy">
              <p>Our services are intended for adults and are not directed to children under 16. We do not knowingly collect personal information from children. If you believe a child has provided us personal information, contact us and we will delete it.</p>
            </Block>

            <Block id="changes" title="Changes to This Policy">
              <p>We may update this Privacy Policy from time to time. Material changes will be reflected by updating the &quot;Last updated&quot; date at the top of this page. Your continued use of the site after changes take effect constitutes acceptance of the revised policy.</p>
            </Block>

            <Block id="contact-privacy" title="Contact Privacy Team">
              <p>For any questions about this Privacy Policy or our data practices, contact our Compliance Office:</p>
              <ul>
                <li>Email: <a href="mailto:legal@lawelitenetwork.com">legal@lawelitenetwork.com</a></li>
                <li>Mail: Law Elite Network, 12 Executive Tower, BKC, Mumbai, MH 400051, India</li>
              </ul>
              <p>See also our <Link href="/terms-of-service" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link href="/disclaimer" className="text-blue-600 hover:underline">Disclaimer</Link>.</p>
            </Block>

          </section>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="space-y-6 scroll-mt-32">
      <h2 className="text-[32px] font-bold text-slate-900 font-serif leading-tight">{title}</h2>
      <div className="prose-legal max-w-none space-y-4 text-slate-700 leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_a]:text-blue-600 [&_a:hover]:underline">
        {children}
      </div>
    </div>
  );
}

function CoralArrow({ className }: { className?: string }) {
  return (
    <svg className={cn("w-4 h-4 text-[#ff6b6b]", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 15l-3 3-3-3" /><path d="M12 18V9a3 3 0 0 1 3-3h3" />
    </svg>
  );
}
