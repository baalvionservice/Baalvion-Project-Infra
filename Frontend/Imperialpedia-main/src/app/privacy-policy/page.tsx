import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/design-system/layout/section';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { ShieldCheck, List } from 'lucide-react';
import { env } from '@/config/env';
import { DoNotSellControl } from '@/components/privacy/DoNotSellControl';

// This page is intentionally code-owned, not CMS-managed (unlike most other
// legal/editorial pages on this site — see CmsPage.tsx). It previously read
// from a CMS "page" document that turned out to contain no real contact info,
// no cookie table, and an explicit "this is a template, have a lawyer review
// it" disclaimer, all live in production. A legal document this specific
// (real data-collection categories, real vendor names, real opt-out
// mechanisms) needs git history and review, not free-text edits from the CMS
// admin panel that can silently drift out of sync with what the site
// actually does. If site practices change (a new analytics/ad vendor, a new
// data category), update this file in the same PR as the code change.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Privacy Policy',
    description:
      'How Imperialpedia collects, uses, shares, and protects your information, including your rights under GDPR, CCPA/CPRA, and India’s DPDP Act.',
    canonical: '/privacy-policy',
  });
}

const LAST_UPDATED = 'August 24, 2026';

const TOC: Array<{ id: string; label: string }> = [
  { id: 'who-we-are', label: 'Who we are & how to reach us' },
  { id: 'information-we-collect', label: 'Information we collect' },
  { id: 'how-we-use', label: 'How we use your information' },
  { id: 'cookies', label: 'Cookies & tracking technologies' },
  { id: 'third-party-services', label: 'Third-party services we use' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'advertising', label: 'Advertising' },
  { id: 'newsletter', label: 'Newsletter' },
  { id: 'contact-form', label: 'Contact form' },
  { id: 'embedded-content', label: 'Embedded content' },
  { id: 'how-we-share', label: 'How we share information' },
  { id: 'privacy-choices', label: 'Your privacy choices (Do Not Sell/Share, GPC)' },
  { id: 'gdpr', label: 'Your rights under the GDPR' },
  { id: 'ccpa', label: 'Your rights under the CCPA/CPRA' },
  { id: 'dpdp', label: 'Your rights under India’s DPDP Act' },
  { id: 'rights-request', label: 'How to submit a privacy rights request' },
  { id: 'retention', label: 'Data retention' },
  { id: 'security', label: 'Data security' },
  { id: 'international-transfers', label: 'International data transfers' },
  { id: 'automated-decisions', label: 'Automated decision-making & profiling' },
  { id: 'children', label: 'Children’s privacy' },
  { id: 'changes', label: 'Changes to this policy' },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-12 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" aria-hidden />
            <Text variant="label" className="text-xs font-bold tracking-widest uppercase">
              Legal
            </Text>
          </div>
          <Text variant="h1" as="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            Privacy Policy
          </Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            Last Updated: {LAST_UPDATED}
          </Text>
          <Text variant="body" className="text-muted-foreground leading-relaxed max-w-3xl">
            This policy explains what personal information {env.appName} collects, why, who we
            share it with, and the rights and choices you have over it. It describes our actual
            practices as of the date above — not a generic template.
          </Text>
        </header>

        <nav aria-label="Table of contents" className="mb-14 rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <List className="h-4 w-4" aria-hidden />
            <Text variant="label" className="text-[11px] font-bold uppercase tracking-widest">
              Table of contents
            </Text>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 list-decimal list-inside text-sm">
            {TOC.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-primary hover:underline">
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <Section spacing="sm" className="prose dark:prose-invert max-w-none space-y-14 [&_h2]:scroll-mt-28">

          <Block id="who-we-are" title="1. Who we are & how to reach us">
            <P>
              {env.appName} is operated by <B>Baalvion Industries Private Limited</B>, part of the
              Baalvion Group ("we", "us", "our"). This policy applies to imperialpedia.com and
              related services.
            </P>
            <List2>
              <li>
                <B>Privacy / Data Protection contact:</B>{' '}
                <a href={`mailto:${env.privacyEmail}`} className="text-primary hover:underline">
                  {env.privacyEmail}
                </a>{' '}
                — this inbox handles privacy questions and rights requests specifically. For
                anything else, use{' '}
                <a href={`mailto:${env.contactEmail}`} className="text-primary hover:underline">
                  {env.contactEmail}
                </a>{' '}
                or{' '}
                <a href={`tel:${env.contactPhone.replace(/\s+/g, '')}`} className="text-primary hover:underline">
                  {env.contactPhone}
                </a>
                .
              </li>
              <li>
                <B>Operating office:</B> Yeshwant Avenue Building, NX Road, Y K Nagar, Virar West,
                Virar, Maharashtra 401303, India
              </li>
              <li>
                <B>Registered office:</B> Baalvion Industries Private Limited, Upper Mania, Po-
                Pakjhola, Semiliguda, Koraput, Odisha 764036, India (CIN: U43121OD2025PTC048479)
              </li>
            </List2>
          </Block>

          <Block id="information-we-collect" title="2. Information we collect">
            <P>We collect the following categories of information:</P>
            <List2>
              <li><B>Name</B> — if you submit the contact form or create an account.</li>
              <li><B>Email address</B> — if you submit the contact form, subscribe to our newsletter, or create an account.</li>
              <li><B>IP address</B> — logged automatically by our servers and by Google Analytics, when configured, for every visit.</li>
              <li><B>Device and browser information</B> — browser type/version, operating system, and screen size, collected automatically via Google Analytics, when configured.</li>
              <li><B>Pages viewed</B> — which pages you visit, how you arrived (referring URL), and when, via Google Analytics, when configured.</li>
              <li><B>Newsletter information</B> — the email address you subscribe with, and your subscribed/unsubscribed status.</li>
              <li><B>Contact-form information</B> — your name, email address, subject, and message content when you submit the form.</li>
              <li><B>Account information</B> — if you create an account, your email address and, if you use the watchlist or portfolio-tracking features, the symbols, quantities, and prices you choose to save. Account creation is optional; most of the site does not require one.</li>
            </List2>
            <P>
              We do not collect payment card numbers, government ID numbers, or biometric data.
            </P>
          </Block>

          <Block id="how-we-use" title="3. How we use your information">
            <P>We use the information above to:</P>
            <List2>
              <li>Operate, maintain, and improve the site and its content;</li>
              <li>Respond to inquiries submitted through the contact form;</li>
              <li>Send the newsletter to subscribers who opted in, and account-related emails to registered users;</li>
              <li>Understand aggregate traffic and reading patterns so we can improve our content, where you have consented to analytics cookies;</li>
              <li>Display advertising, including personalized advertising where you have consented;</li>
              <li>Detect, prevent, and investigate fraud, abuse, and security incidents;</li>
              <li>Comply with applicable legal obligations.</li>
            </List2>
            <P>
              Where the GDPR applies, our legal bases are: your <B>consent</B> (non-essential
              cookies, newsletter, personalized advertising), our <B>legitimate interests</B> (running
              and securing the site, aggregate analytics), and <B>legal obligation</B> (responding to
              lawful requests).
            </P>
          </Block>

          <Block id="cookies" title="4. Cookies & tracking technologies">
            <P>
              Cookies are small text files a site stores on your device. Some information below is
              stored in your browser's local storage rather than a cookie; we note that explicitly
              where it applies.
            </P>
            <CookieTable />
            <P>
              You control non-essential cookies through the consent banner shown on your first
              visit, through your browser settings, or at any time via the{' '}
              <a href="#privacy-choices" className="text-primary hover:underline">
                Your Privacy Choices
              </a>{' '}
              section below. Blocking essential cookies/local storage may affect how parts of the
              site work.
            </P>
          </Block>

          <Block id="third-party-services" title="5. Third-party services we use">
            <P>We rely on the following providers. This list reflects what is actually integrated today:</P>
            <List2>
              <li><B>Google Analytics (GA4)</B> — traffic and content-performance analytics, when configured for the current environment. Loads only after you accept analytics cookies.</li>
              <li><B>Google Tag Manager</B> — a tag-management container we use to load the scripts above, when configured. It does not itself collect additional data beyond what the tags it loads collect.</li>
              <li><B>Google AdSense</B> — serves the advertising shown on this site. See <a href="#advertising" className="text-primary hover:underline">Advertising</a> below.</li>
              <li><B>Vercel</B> — hosts and serves the website (frontend hosting/CDN).</li>
              <li><B>Amazon Web Services (AWS)</B> — hosts our own backend services (including the servers behind api.baalvion.com) and sends transactional/contact-form and newsletter emails via Amazon SES, under our own AWS account. This is our infrastructure, not a third-party marketing platform.</li>
            </List2>
            <P>
              We do <B>not</B> use a third-party newsletter platform (e.g. Mailchimp), a third-party
              form service (e.g. Typeform), or a third-party cookie-consent platform — the newsletter
              list, contact-form handling, and cookie-consent banner are all built and operated by
              us, on our own infrastructure.
            </P>
          </Block>

          <Block id="analytics" title="6. Analytics">
            <P>
              When Google Analytics is configured for the site, it helps us understand which
              articles are read, how visitors navigate, and where to improve. It sets its own
              cookies (see the table above) and processes your IP address and on-site behavior on
              Google's servers. We use this in aggregate to improve content — we do not use it to
              identify you individually. Analytics only runs after you accept cookies, is disabled
              entirely if you decline, and always respects a Global Privacy Control signal (see{' '}
              <a href="#privacy-choices" className="text-primary hover:underline">below</a>).
            </P>
          </Block>

          <Block id="advertising" title="7. Advertising">
            <P>
              This site displays advertising served by <B>Google AdSense</B>. When you have
              consented to advertising cookies, Google may collect your IP address, cookie
              identifiers, and browsing activity on this and other sites to show <B>personalized</B>{' '}
              ads and measure their performance. If you decline, or send a Global Privacy Control
              signal, ads may still show but are <B>non-personalized</B> — based on the page's
              content and your approximate location, not your browsing history.
            </P>
            <P>You can opt out of personalized advertising at any time:</P>
            <List2>
              <li>Using the <a href="#privacy-choices" className="text-primary hover:underline">Do Not Sell or Share</a> control on this page, or the cookie banner's "Decline" option;</li>
              <li>Through <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Ads Settings</a>;</li>
              <li>Through the Digital Advertising Alliance's opt-out at <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">aboutads.info</a>;</li>
              <li>Automatically, if your browser or an extension sends a Global Privacy Control signal.</li>
            </List2>
            <P>
              We do not control what Google does with data once it processes it as an independent
              controller; see{' '}
              <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                How Google uses information from sites that use its services
              </a>
              .
            </P>
          </Block>

          <Block id="newsletter" title="8. Newsletter">
            <P>
              If you subscribe, we store only your email address and subscription status in our own
              database (not a third-party marketing platform) and use Amazon SES, under our own AWS
              account, to send issues. We do not currently track opens or clicks on newsletter
              emails. To unsubscribe, email{' '}
              <a href={`mailto:${env.privacyEmail}`} className="text-primary hover:underline">
                {env.privacyEmail}
              </a>{' '}
              with the address you subscribed with, and we will remove it. A self-service
              unsubscribe link is on our roadmap; until it ships, email is the reliable way to stop
              receiving newsletter emails.
            </P>
          </Block>

          <Block id="contact-form" title="9. Contact form">
            <P>
              Submitting the contact form sends your name, email address, subject, and message to
              our own internal notification system, which relays it as an email to our team so we
              can respond. It is not shared with any advertiser, analytics provider, or other third
              party, and is not added to the newsletter list unless you separately subscribe. We
              retain contact-form submissions as described in{' '}
              <a href="#retention" className="text-primary hover:underline">Data Retention</a> below.
            </P>
          </Block>

          <Block id="embedded-content" title="10. Embedded content">
            <P>
              We do not currently embed third-party video players, social media posts, or other
              iframe-based embeds in our articles — our content sanitizer strips iframe tags from
              article bodies, so this isn't possible today even by mistake. If that changes, this
              section will be updated to name the specific providers and what they collect before
              any such embed ships.
            </P>
          </Block>

          <Block id="how-we-share" title="11. How we share information">
            <P>
              We do not sell personal information for money, and we do not share it with third
              parties for their own independent marketing purposes. We share information only:
            </P>
            <List2>
              <li>With service providers who process it on our behalf under contract (hosting, email delivery — see <a href="#third-party-services" className="text-primary hover:underline">Third-Party Services</a>);</li>
              <li>With Google, as an independent controller, for analytics and advertising, only when you have consented (see <a href="#advertising" className="text-primary hover:underline">Advertising</a>);</li>
              <li>When required by law, legal process, or to protect our rights, users, or the public;</li>
              <li>As part of a merger, acquisition, or asset transfer, subject to the same protections described here.</li>
            </List2>
            <P>
              <B>A more precise note on "sale" and "sharing":</B> under the CCPA/CPRA, the broad
              legal definitions of "sale" and "sharing" can include some advertising-cookie
              arrangements even without money changing hands. To the extent our use of Google
              AdSense/Analytics with personalized-advertising cookies qualifies as a "sale" or
              "sharing" under that definition, we treat it that way and honor your right to opt out
              — see <a href="#privacy-choices" className="text-primary hover:underline">Your Privacy Choices</a> below. We are not
              making the narrower claim that no data-sharing arrangement we have could ever meet
              that legal definition.
            </P>
          </Block>

          <Block id="privacy-choices" title="12. Your privacy choices: Do Not Sell/Share & Global Privacy Control">
            <P>
              You can opt out of the sale/sharing of your personal information for advertising
              purposes at any time using the control below. This has the same effect as declining
              the cookie banner: it revokes ad and analytics consent (Google Consent Mode v2) on
              this device/browser.
            </P>
            <DoNotSellControl />
            <P className="mt-4">
              <B>Global Privacy Control (GPC):</B> if your browser or a browser extension sends a{' '}
              <a href="https://globalprivacycontrol.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Global Privacy Control
              </a>{' '}
              signal, we detect it automatically on your first visit and treat it as a valid opt-out
              request under the CCPA/CPRA — no separate action needed. Because the opt-out is stored
              per browser/device, you will need to opt out again on each device or browser you use,
              or if you clear your browser's local storage.
            </P>
          </Block>

          <Block id="gdpr" title="13. Your rights under the GDPR">
            <P>
              If you are in the European Economic Area or the United Kingdom, you have the right
              to: access the personal data we hold about you; correct inaccurate data; request
              deletion; restrict or object to processing; receive your data in a portable format;
              and withdraw consent at any time without affecting the lawfulness of processing before
              the withdrawal. You also have the right to lodge a complaint with your local data
              protection authority. See{' '}
              <a href="#rights-request" className="text-primary hover:underline">How to Submit a Request</a> below.
            </P>
          </Block>

          <Block id="ccpa" title="14. Your rights under the CCPA/CPRA">
            <P>If you are a California resident, you have the right to:</P>
            <List2>
              <li>Know what personal information we collect, use, and disclose, and for what purpose;</li>
              <li>Request deletion of your personal information, subject to legal exceptions;</li>
              <li>Correct inaccurate personal information;</li>
              <li>Opt out of the sale or sharing of your personal information (see <a href="#privacy-choices" className="text-primary hover:underline">Your Privacy Choices</a>);</li>
              <li>Not be discriminated against for exercising any of these rights.</li>
            </List2>
            <P>
              <B>How to submit a request:</B> email{' '}
              <a href={`mailto:${env.privacyEmail}`} className="text-primary hover:underline">
                {env.privacyEmail}
              </a>{' '}
              with the subject "CCPA Request" — see{' '}
              <a href="#rights-request" className="text-primary hover:underline">how to submit a privacy rights request</a>{' '}
              for what to include.{' '}
              <B>Verification:</B> because most of our data is tied only to an email address, we
              verify requests by confirming you control that email address (we will reply to the
              address on file, or ask you to confirm it) before acting on access or deletion
              requests. <B>Response time:</B> we aim to respond within 45 calendar days of a
              verifiable request, extendable once by another 45 days for complex requests, with
              notice to you of the extension.
            </P>
          </Block>

          <Block id="dpdp" title="15. Your rights under India's DPDP Act">
            <P>
              Baalvion Industries Private Limited is incorporated in India, and processes personal
              data as a <B>Data Fiduciary</B> under India's Digital Personal Data Protection Act,
              2023 (DPDP Act). If it applies to your data, you (as a "Data Principal") have the
              right to: obtain a summary of the personal data we process about you and the
              processing activities; request correction, completion, updating, or erasure of your
              personal data; withdraw consent at any time (without affecting processing already
              carried out); nominate another individual to exercise your rights on your behalf in
              the event of death or incapacity; and file a grievance with us before escalating to
              the Data Protection Board of India.
            </P>
            <P>
              <B>Grievance Officer:</B> reachable at{' '}
              <a href={`mailto:${env.privacyEmail}`} className="text-primary hover:underline">
                {env.privacyEmail}
              </a>{' '}
              for any grievance or rights request under the DPDP Act.
            </P>
          </Block>

          <Block id="rights-request" title="16. How to submit a privacy rights request">
            <P>To request access, correction, deletion, or an opt-out, email{' '}
              <a href={`mailto:${env.privacyEmail}`} className="text-primary hover:underline">
                {env.privacyEmail}
              </a>{' '}
              and include:
            </P>
            <List2>
              <li>The email address associated with your data (the one you used to contact us, subscribe, or register);</li>
              <li>Which right you are exercising (access, correction, deletion, portability, or opt-out);</li>
              <li>Any detail that helps us locate your data faster (e.g. approximate date you contacted us or subscribed).</li>
            </List2>
            <P>
              We reply from the same address, which also confirms you control it. Response
              timelines: <B>GDPR</B> — within 30 days, extendable by up to 60 further days for
              complex requests; <B>CCPA/CPRA</B> — within 45 days, extendable once by 45 days;{' '}
              <B>DPDP Act</B> — without undue delay, in line with the timelines the Act and its
              rules prescribe.
            </P>
          </Block>

          <Block id="retention" title="17. Data retention">
            <P>We keep different categories of data for different periods, based on why we collected them:</P>
            <List2>
              <li><B>Contact-form submissions:</B> up to 24 months from submission, to maintain a support history, then deleted.</li>
              <li><B>Newsletter subscriber emails:</B> until you unsubscribe or ask us to delete them.</li>
              <li><B>Account data (if you register):</B> for as long as your account is active; deleted within 90 days of a verified deletion request.</li>
              <li><B>Server and analytics logs:</B> Google Analytics retains user-and-event-level data per its own configured setting (Google's default is 14 months) before automatic deletion; our own server logs are retained for a shorter operational window for security and debugging.</li>
            </List2>
            <P>We may retain information longer where required to comply with a legal obligation or resolve a dispute.</P>
          </Block>

          <Block id="security" title="18. Data security">
            <P>
              We use reasonable technical and organizational measures — including encrypted
              connections (HTTPS/TLS) and access controls on our backend systems — to protect the
              data we hold. No method of transmission or storage is completely secure, and we cannot
              guarantee absolute security.
            </P>
          </Block>

          <Block id="international-transfers" title="19. International data transfers">
            <P>
              Our backend infrastructure runs on AWS in India (Mumbai region). Our frontend is
              hosted on Vercel, which serves traffic through a global edge network that may process
              data outside India. Google Analytics and Google AdSense, when active, process data on
              Google's global infrastructure, primarily in the United States. Where we or our
              providers transfer personal data out of the EEA/UK, we and they rely on recognized
              safeguards such as the EU-U.S. Data Privacy Framework (Google is a certified
              participant) or Standard Contractual Clauses.
            </P>
          </Block>

          <Block id="automated-decisions" title="20. Automated decision-making & profiling">
            <P>
              We do <B>not</B> use automated decision-making or profiling that produces legal or
              similarly significant effects on you (for example, no automated eligibility,
              pricing, or credit decisions). Features like the watchlist and portfolio tracker
              simply display data you chose to save — they do not score, rank, or make decisions
              about you. Personalized advertising, where you've consented, uses standard
              interest-based targeting from Google, not a system we operate ourselves.
            </P>
          </Block>

          <Block id="children" title="21. Children's privacy">
            <P>
              {env.appName} is intended for a general, adult audience and is not directed at
              children. We do not knowingly collect personal information from anyone under{' '}
              <B>13 years old</B> (the U.S. COPPA threshold), under <B>16 years old</B> if you are
              in the EEA/UK (the GDPR default digital-consent age, which some member states set
              lower), or under <B>18 years old</B> if you are in India (the DPDP Act's definition of
              a child, which requires verifiable parental consent for any processing). If you
              believe a child has provided us personal data, email{' '}
              <a href={`mailto:${env.privacyEmail}`} className="text-primary hover:underline">
                {env.privacyEmail}
              </a>{' '}
              and we will delete it.
            </P>
          </Block>

          <Block id="changes" title="22. Changes to this policy">
            <P>
              We update this policy when our practices change. Minor edits (wording, formatting)
              are reflected by updating the "Last Updated" date at the top without separate notice.
              For <B>material changes</B> — a new category of data we collect, a new purpose for
              using it, a new third party we share it with, or a reduction in your rights — we will
              post a visible notice on this page and, where we have your email address, notify you
              directly, at least 15 days before the change takes effect where practicable.
            </P>
          </Block>

        </Section>
      </Container>
    </main>
  );
}

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="space-y-4 scroll-mt-28">
      <Text variant="h3" as="h2" className="text-xl font-bold">
        {title}
      </Text>
      {children}
    </div>
  );
}

function P({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Text variant="body" className={`text-muted-foreground leading-relaxed ${className ?? ''}`}>
      {children}
    </Text>
  );
}

function List2({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">{children}</ul>;
}

function B({ children }: { children: React.ReactNode }) {
  return <strong className="text-foreground">{children}</strong>;
}

type CookieRow = {
  name: string;
  provider: string;
  purpose: string;
  duration: string;
  essential: boolean;
};

const COOKIE_ROWS: CookieRow[] = [
  {
    name: 'imperialpedia_cookie_consent',
    provider: 'Imperialpedia (first-party — stored in your browser’s local storage, not a cookie)',
    purpose: 'Remembers your cookie-consent choice so we don’t ask again',
    duration: 'Until you clear your browser storage',
    essential: true,
  },
  {
    name: '_ga',
    provider: 'Google Analytics',
    purpose: 'Distinguishes visitors for analytics',
    duration: '2 years',
    essential: false,
  },
  {
    name: '_ga_<container-id>',
    provider: 'Google Analytics (GA4)',
    purpose: 'Persists session state for GA4 measurement',
    duration: '2 years',
    essential: false,
  },
  {
    name: 'IDE / test_cookie / other DoubleClick cookies',
    provider: 'Google AdSense / Google Ads',
    purpose: 'Ad selection, frequency capping, and measurement',
    duration: 'Up to 13 months (per Google’s published retention)',
    essential: false,
  },
];

function CookieTable() {
  return (
    <div className="not-prose overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-3 font-semibold">Name</th>
            <th className="p-3 font-semibold">Provider</th>
            <th className="p-3 font-semibold">Purpose</th>
            <th className="p-3 font-semibold">Duration</th>
            <th className="p-3 font-semibold">Type</th>
          </tr>
        </thead>
        <tbody>
          {COOKIE_ROWS.map((row) => (
            <tr key={row.name} className="border-t border-border align-top">
              <td className="p-3 font-mono text-xs">{row.name}</td>
              <td className="p-3 text-muted-foreground">{row.provider}</td>
              <td className="p-3 text-muted-foreground">{row.purpose}</td>
              <td className="p-3 text-muted-foreground">{row.duration}</td>
              <td className="p-3">{row.essential ? 'Essential' : 'Non-essential'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="p-3 text-xs text-muted-foreground border-t border-border">
        Google-set cookies (_ga, IDE, etc.) are only placed when Google Analytics/AdSense is
        active for the current environment and you have consented to non-essential cookies.
      </p>
    </div>
  );
}
