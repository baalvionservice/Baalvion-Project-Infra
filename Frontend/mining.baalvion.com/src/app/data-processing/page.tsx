import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Data Processing Addendum (DPA)",
  description:
    "The Data Processing Addendum for B2B customers of the Baalvion Mining platform: controller/processor roles, processing scope, sub-processing, security, data-subject requests, breach notification, audit, and international transfers.",
  alternates: { canonical: "https://mining.baalvion.com/data-processing" },
};

export default function DataProcessingAddendumPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container px-4 md:px-8 max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Legal &amp; Compliance</p>
            <h1 className="mt-3 text-4xl md:text-5xl font-headline font-bold tracking-tight">
              Data Processing Addendum
            </h1>
            <p className="mt-4 text-sm font-medium uppercase tracking-widest opacity-90">Effective Date: June 12, 2026</p>
          </div>
        </section>

        <section className="container px-4 md:px-8 max-w-4xl mx-auto py-12">
          <div className="bg-white p-8 md:p-12 rounded-xl shadow-sm space-y-10 text-slate-600 leading-relaxed">
            <p className="text-lg text-slate-700">
              This Data Processing Addendum (&quot;DPA&quot;) applies to business (B2B) customers of the Baalvion Mining
              platform (the &quot;Platform&quot;) operated by Baalvion Industries Private Limited (the
              &quot;Company&quot;). It forms part of the agreement between you (the &quot;Customer&quot;) and the Company
              and governs the processing of personal data carried out on the Customer&apos;s behalf. It should be read
              with our{" "}
              <Link href="/privacy" className="text-primary font-semibold underline">Privacy Policy</Link>.
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">1. Roles of the Parties</h2>
              <p>
                Where the Company processes personal data on the Customer&apos;s instructions to provide the Platform,
                the Customer acts as the controller (data fiduciary) and the Company acts as the processor (data
                processor). Each party shall comply with its respective obligations under applicable data-protection
                law, including the Digital Personal Data Protection Act, 2023.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">2. Scope &amp; Purpose of Processing</h2>
              <p>
                The Company processes personal data only as necessary to provide the Platform and as instructed by the
                Customer under the agreement. The subject matter, duration, nature, and purpose of processing, the types
                of personal data, and the categories of data subjects are as set out in the agreement and this DPA.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">3. Sub-Processing</h2>
              <p>
                The Customer authorises the Company to engage sub-processors to support the provision of the Platform.
                The Company will impose data-protection obligations on sub-processors that are no less protective than
                those in this DPA and remains responsible for their performance. A current list of sub-processor
                categories is available upon request.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">4. Security</h2>
              <p>
                The Company implements appropriate technical and organisational measures designed to protect personal
                data against unauthorised or unlawful processing and against accidental loss, destruction, or damage,
                including encryption in transit and at rest, access controls, and monitoring.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">5. Data-Subject Requests</h2>
              <p>
                Taking into account the nature of the processing, the Company will provide reasonable assistance to the
                Customer in responding to requests from data subjects (or principals) to exercise their rights. Where
                the Company receives such a request directly, it will, where appropriate, direct the individual to the
                Customer.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">6. Breach Notification</h2>
              <p>
                The Company will notify the Customer without undue delay after becoming aware of a personal-data breach
                affecting the Customer&apos;s data and will provide reasonable information to assist the Customer in
                meeting its notification obligations under applicable law.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">7. Audit</h2>
              <p>
                The Company will make available information reasonably necessary to demonstrate compliance with this DPA
                and will allow for and contribute to audits, subject to reasonable confidentiality, security, and
                scheduling safeguards.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">8. International Transfers</h2>
              <p>
                Where personal data is transferred or processed outside India, the Company will implement appropriate
                safeguards consistent with applicable data-protection law and will not transfer data to jurisdictions
                restricted by the Government of India.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">9. Term &amp; Deletion</h2>
              <p>
                This DPA remains in effect for the duration of the processing under the agreement. Upon termination or
                expiry, the Company will, at the Customer&apos;s choice, delete or return the personal data, except where
                retention is required by applicable law.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">10. Full Executable DPA</h2>
              <p>
                This page summarises the data-processing terms that form part of the Customer agreement. A full,
                executable DPA is available upon request by contacting <strong>trade@baalvion.com</strong>.
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
