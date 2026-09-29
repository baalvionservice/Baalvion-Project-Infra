import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "How the Baalvion Mining platform uses cookies, the categories of cookies and their retention periods, and how to manage or withdraw your consent.",
  alternates: { canonical: "https://mining.baalvion.com/cookies" },
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container px-4 md:px-8 max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Legal &amp; Compliance</p>
            <h1 className="mt-3 text-4xl md:text-5xl font-headline font-bold tracking-tight">Cookie Policy</h1>
            <p className="mt-4 text-sm font-medium uppercase tracking-widest opacity-90">Effective Date: June 12, 2026</p>
          </div>
        </section>

        <section className="container px-4 md:px-8 max-w-4xl mx-auto py-12">
          <div className="bg-white p-8 md:p-12 rounded-xl shadow-sm space-y-10 text-slate-600 leading-relaxed">
            <p className="text-lg text-slate-700">
              This Cookie Policy explains how Baalvion Industries Private Limited (operating the brand Baalvion Mining
              Inc.) uses cookies and similar technologies on the Baalvion Mining platform (the &quot;Platform&quot;).
              It should be read together with our{" "}
              <Link href="/privacy" className="text-primary font-semibold underline">Privacy Policy</Link>.
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">1. What Are Cookies?</h2>
              <p>
                Cookies are small text files placed on your device when you visit a website. They help the Platform
                function, remember your preferences, and understand how the Platform is used. We also use similar
                technologies such as local storage, which serve comparable purposes.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">2. Categories of Cookies We Use</h2>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-900">
                    <tr>
                      <th className="px-4 py-3 font-bold">Category</th>
                      <th className="px-4 py-3 font-bold">Purpose</th>
                      <th className="px-4 py-3 font-bold">Example</th>
                      <th className="px-4 py-3 font-bold">Retention</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="px-4 py-3 font-semibold text-slate-800">Strictly Necessary</td>
                      <td className="px-4 py-3">Required for the Platform to function, including security, authentication, and session management. Cannot be switched off.</td>
                      <td className="px-4 py-3">Login session token; CSRF/security token</td>
                      <td className="px-4 py-3">Session to ~12 months</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-slate-800">Functional / Preferences</td>
                      <td className="px-4 py-3">Remember your choices and settings to provide a more personalised experience.</td>
                      <td className="px-4 py-3">Language preference; cookie-consent choice</td>
                      <td className="px-4 py-3">Up to 12 months</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-slate-800">Analytics / Performance</td>
                      <td className="px-4 py-3">Help us understand how the Platform is used so we can improve it. Set only with your consent.</td>
                      <td className="px-4 py-3">Aggregated usage and page-view metrics</td>
                      <td className="px-4 py-3">Up to 24 months</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm">
                We do not use advertising or cross-site tracking cookies on the Platform.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">3. Consent Management</h2>
              <p>
                When you first visit the Platform, a cookie banner lets you choose <strong>Accept All</strong>,{" "}
                <strong>Reject All</strong>, or <strong>Manage Preferences</strong>. Strictly necessary cookies are
                always active because the Platform cannot operate without them; functional and analytics cookies are set
                only where you allow them. Your preferences are stored in your browser&apos;s localStorage under the key{" "}
                <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800">cookie-consent</code>.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">4. How to Change or Withdraw Consent</h2>
              <p>You can change or withdraw your consent at any time by:</p>
              <ul className="list-disc pl-8 space-y-2 text-sm">
                <li>Reopening the cookie preferences from the cookie banner and updating your choices.</li>
                <li>Clearing the <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800">cookie-consent</code> entry from your browser&apos;s localStorage, which will cause the banner to appear again.</li>
                <li>Adjusting your browser settings to block or delete cookies. Note that blocking strictly necessary cookies may prevent parts of the Platform from working.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">5. Changes to This Policy</h2>
              <p>
                We may update this Cookie Policy from time to time. The &quot;Effective Date&quot; above indicates when
                this version took effect. Material changes will be communicated through the Platform.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">6. Contact</h2>
              <p>
                For questions about our use of cookies, contact Baalvion Industries Private Limited at{" "}
                <strong>trade@baalvion.com</strong>.
              </p>
            </section>

            <div className="pt-8 border-t">
              <p className="text-xs text-slate-500 italic leading-relaxed">
                This document is provided for transparency and does not constitute legal advice. Baalvion Mining Inc.
                is a brand operated by Baalvion Industries Private Limited, incorporated in India under CIN
                U43121OD2025PTC048479.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
