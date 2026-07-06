"use client";

import React, { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { List } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const LAST_UPDATED = 'June 30, 2026';

export default function TermsOfServicePage() {
  const [isExpanded, setIsExpanded] = useState(true);

  const tocLinks = [
    { label: "Acceptance of Terms", id: "acceptance" },
    { label: "Eligibility", id: "eligibility" },
    { label: "Description of Service", id: "service" },
    { label: "No Attorney–Client Relationship", id: "no-relationship" },
    { label: "User Accounts & Responsibilities", id: "accounts" },
    { label: "Acceptable Use", id: "acceptable-use" },
    { label: "Intellectual Property & Licensing", id: "ip" },
    { label: "Third-Party Links & Advertising", id: "third-party" },
    { label: "Disclaimers & Limitation of Liability", id: "disclaimers" },
    { label: "Indemnification", id: "indemnification" },
    { label: "Governing Law", id: "governing-law" },
    { label: "Changes to These Terms", id: "changes" },
    { label: "Contact", id: "contact" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-4xl">

          <header className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-600 bg-blue-50 px-2 py-1 rounded">Legal Agreement</span>
            </div>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-3 leading-tight">
              Terms of Service
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

          <div className="border-l-4 border-blue-600 bg-slate-50 rounded-r-2xl p-8 mb-16">
            <p className="text-slate-700 leading-relaxed">
              These Terms of Service (the &quot;Terms&quot;) govern your access to and use of Law Elite Network,
              located at lawelitenetwork.com, together with all related pages, content, tools, newsletters, and
              services (collectively, the &quot;Service&quot;). Please read these Terms carefully. By accessing or
              using the Service, you agree to be bound by them. If you do not agree, you must not use the Service.
            </p>
          </div>

          <section className="space-y-16">

            <Block id="acceptance" title="Acceptance of Terms">
              <p>
                By accessing, browsing, or otherwise using the Service in any way, you acknowledge that you have read,
                understood, and agree to be bound by these Terms and by our{' '}
                <Link href="/privacy-policy">Privacy Policy</Link>,{' '}
                <Link href="/disclaimer">Disclaimer</Link>, and{' '}
                <Link href="/editorial-standards">Editorial Standards</Link>, each of which is incorporated into these
                Terms by reference. These Terms constitute a legally binding agreement between you and Law Elite Network
                (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
              </p>
              <p>
                If you are using the Service on behalf of an organization, you represent that you have authority to bind
                that organization to these Terms, in which case &quot;you&quot; refers to that organization. If you do
                not agree to any part of these Terms, please discontinue use of the Service immediately.
              </p>
            </Block>

            <Block id="eligibility" title="Eligibility">
              <p>
                The Service is intended for adults. You must be at least 16 years of age (or the age of digital consent
                in your jurisdiction, whichever is greater) to use the Service, and at least 18 years of age to create
                an account or transact through the Service. By using the Service, you represent and warrant that you
                meet these requirements and that you are not barred from using the Service under the laws of your
                jurisdiction.
              </p>
              <p>
                We provide content covering laws across multiple countries and jurisdictions. You are responsible for
                ensuring that your access to and use of the Service complies with the laws applicable to you in the
                place from which you access it.
              </p>
            </Block>

            <Block id="service" title="Description of Service">
              <p>
                Law Elite Network is a legal knowledge platform that publishes general legal information, explainer
                articles, jurisdiction guides, and educational resources, and that operates a directory through which
                users may discover legal practitioners. The Service is designed to help readers understand legal
                concepts and navigate where to seek qualified help.
              </p>
              <p>
                <strong>The Service provides general legal information, not legal advice.</strong> Content published on
                the Service is offered for informational and educational purposes only. It is not a substitute for
                advice from a licensed attorney who can evaluate the specific facts of your situation. Laws vary by
                jurisdiction and change over time, and information that is accurate for one reader or location may not
                apply to another. You should not act, or refrain from acting, on the basis of any content on the Service
                without first obtaining advice from a qualified professional licensed in your jurisdiction.
              </p>
            </Block>

            <Block id="no-relationship" title="No Attorney–Client Relationship">
              <p>
                Your use of the Service — including reading our articles, using our tools, subscribing to our
                newsletter, submitting an inquiry, or contacting a practitioner listed in our directory — does not
                create an attorney–client relationship between you and Law Elite Network or any contributor, editor,
                reviewer, or practitioner featured on the platform.
              </p>
              <p>
                An attorney–client relationship is formed only by a separate, signed engagement agreement directly
                between you and a licensed lawyer. Any communication you send through the Service before such an
                engagement exists may not be treated as privileged or confidential. Do not transmit time-sensitive,
                confidential, or sensitive legal information through the Service expecting it to be protected by
                attorney–client privilege.
              </p>
            </Block>

            <Block id="accounts" title="User Accounts & Responsibilities">
              <p>
                Some features of the Service require you to create an account. When you register, you agree to provide
                accurate, current, and complete information and to keep it updated. You are responsible for:
              </p>
              <ul>
                <li>Maintaining the confidentiality of your login credentials and any authentication factors;</li>
                <li>All activity that occurs under your account, whether or not authorized by you;</li>
                <li>Notifying us promptly at <a href="mailto:legal@lawelitenetwork.com">legal@lawelitenetwork.com</a> of any unauthorized use or suspected breach of security;</li>
                <li>Ensuring that any content you submit complies with these Terms and applicable law.</li>
              </ul>
              <p>
                We reserve the right to suspend or terminate accounts that contain false information, that are used in
                violation of these Terms, or that pose a security or legal risk to the Service or other users.
              </p>
            </Block>

            <Block id="acceptable-use" title="Acceptable Use">
              <p>You agree not to use the Service to, and not to permit or encourage any third party to:</p>
              <ul>
                <li>Violate any applicable law, regulation, or the rights of any person or entity;</li>
                <li>Post or transmit content that is unlawful, defamatory, harassing, fraudulent, or infringing;</li>
                <li>Impersonate any person or entity, or misrepresent your affiliation with any person or entity, including holding yourself out as a licensed attorney when you are not;</li>
                <li>Upload viruses, malware, or any code designed to disrupt, damage, or gain unauthorized access to the Service or its users;</li>
                <li>Scrape, harvest, or systematically extract data or content from the Service without our prior written consent, including for the purpose of training machine-learning models;</li>
                <li>Circumvent, disable, or interfere with security or access-control features of the Service;</li>
                <li>Use the Service to provide legal advice to others as though it originated from Law Elite Network.</li>
              </ul>
              <p>
                We may investigate and take appropriate legal action against anyone who violates this section, including
                removing offending content and reporting violations to law-enforcement authorities.
              </p>
            </Block>

            <Block id="ip" title="Intellectual Property & Licensing">
              <p>
                All content on the Service — including articles, text, graphics, logos, illustrations, the &quot;Law
                Elite Network&quot; name and marks, page layouts, and the selection and arrangement of content — is owned
                by or licensed to Law Elite Network and is protected by copyright, trademark, and other intellectual
                property laws. The Elite Knowledge Group publishing family and its licensors retain all rights not
                expressly granted.
              </p>
              <p>
                Subject to your compliance with these Terms, we grant you a limited, revocable, non-exclusive,
                non-transferable license to access and view the Service for your own personal, non-commercial use. You
                may not reproduce, republish, distribute, modify, create derivative works from, publicly display, or
                commercially exploit any part of the Service without our prior written permission, except that you may
                share links to our pages and quote brief excerpts with proper attribution.
              </p>
              <p>
                If you submit content to the Service (for example, comments, error reports, or feedback), you grant us a
                worldwide, royalty-free, perpetual, non-exclusive license to use, reproduce, and display that content in
                connection with operating and improving the Service, and you represent that you have the rights
                necessary to grant that license.
              </p>
            </Block>

            <Block id="third-party" title="Third-Party Links & Advertising">
              <p>
                The Service may contain links to third-party websites, references to third-party practitioners, and
                advertisements served by third-party advertising networks, including <strong>Google AdSense</strong> and
                other ad partners. These links, references, and advertisements are provided for convenience and to help
                fund our free content.
              </p>
              <ul>
                <li>Advertisements are clearly distinguishable from editorial content, and the presence of an advertisement does not constitute an endorsement by Law Elite Network.</li>
                <li>Our editorial decisions are made independently of any advertising relationship, as described in our <Link href="/editorial-standards">Editorial Standards</Link>.</li>
                <li>Third-party ad networks may use cookies and similar technologies to serve and measure ads; their use of your data is governed by their own policies. See our <Link href="/privacy-policy">Privacy Policy</Link> for details and opt-out options.</li>
                <li>We do not control and are not responsible for the content, accuracy, privacy practices, or services of any third-party website, advertiser, or practitioner. Any dealings you have with a third party are solely between you and that third party.</li>
              </ul>
            </Block>

            <Block id="disclaimers" title="Disclaimers & Limitation of Liability">
              <p>
                The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis, without warranties
                of any kind, whether express or implied, including warranties of merchantability, fitness for a
                particular purpose, accuracy, and non-infringement. We do not warrant that the Service will be
                uninterrupted, error-free, secure, or that any information on it is current, complete, or accurate. Your
                use of the Service is at your own risk. This section operates together with our{' '}
                <Link href="/disclaimer">Disclaimer</Link>.
              </p>
              <p>
                To the fullest extent permitted by applicable law, Law Elite Network and its owners, officers, editors,
                contributors, affiliates, and licensors shall not be liable for any indirect, incidental, special,
                consequential, exemplary, or punitive damages, or for any loss of profits, data, goodwill, or other
                intangible losses, arising out of or related to your use of, or inability to use, the Service or any
                content on it — even if we have been advised of the possibility of such damages. In no event shall our
                total aggregate liability arising out of or related to the Service exceed one hundred U.S. dollars
                (USD $100). Some jurisdictions do not allow the exclusion or limitation of certain damages, so some of
                the above limitations may not apply to you.
              </p>
            </Block>

            <Block id="indemnification" title="Indemnification">
              <p>
                You agree to indemnify, defend, and hold harmless Law Elite Network and its owners, officers, editors,
                contributors, affiliates, and licensors from and against any claims, liabilities, damages, losses, and
                expenses, including reasonable legal fees, arising out of or in any way connected with: (a) your access
                to or use of the Service; (b) your violation of these Terms; (c) your violation of any law or the rights
                of any third party; or (d) any content you submit to the Service. We reserve the right to assume the
                exclusive defense and control of any matter subject to indemnification by you, in which case you agree to
                cooperate with our defense of that claim.
              </p>
            </Block>

            <Block id="governing-law" title="Governing Law">
              <p>
                These Terms and any dispute arising out of or related to them or the Service shall be governed by and
                construed in accordance with the laws of India, without regard to its conflict-of-laws principles.
                Subject to any mandatory consumer-protection rights you may have in your country of residence, you agree
                that the courts located in Mumbai, Maharashtra, India shall have exclusive jurisdiction over any such
                dispute. Nothing in this section limits any non-waivable statutory rights available to you under the
                laws of your jurisdiction.
              </p>
            </Block>

            <Block id="changes" title="Changes to These Terms">
              <p>
                We may revise these Terms from time to time to reflect changes in our Service, our practices, or
                applicable law. When we make material changes, we will update the &quot;Last updated&quot; date at the
                top of this page and, where appropriate, provide additional notice. Your continued use of the Service
                after revised Terms take effect constitutes your acceptance of the changes. If you do not agree to the
                revised Terms, you must stop using the Service.
              </p>
            </Block>

            <Block id="contact" title="Contact">
              <p>If you have questions about these Terms, please contact us:</p>
              <ul>
                <li>Email: <a href="mailto:legal@lawelitenetwork.com">legal@lawelitenetwork.com</a></li>
                <li>Mail: Law Elite Network, 12 Executive Tower, BKC, Mumbai, MH 400051, India</li>
                <li>Or visit our <Link href="/contact-us">Contact</Link> page.</li>
              </ul>
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
