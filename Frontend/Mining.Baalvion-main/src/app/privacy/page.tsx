import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Baalvion Industries Private Limited collects, uses, shares, retains, and protects personal and business data, your rights under the DPDP Act 2023, and how to contact our Grievance Officer.",
  alternates: { canonical: "https://mining.baalvion.com/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container px-4 md:px-8 max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Legal &amp; Compliance</p>
            <h1 className="mt-3 text-4xl md:text-5xl font-headline font-bold tracking-tight">Privacy Policy</h1>
            <p className="mt-4 text-sm font-medium uppercase tracking-widest opacity-90">Effective Date: June 12, 2026</p>
          </div>
        </section>

        <section className="container px-4 md:px-8 max-w-4xl mx-auto py-12">
          <div className="bg-white p-8 md:p-12 rounded-xl shadow-sm space-y-10 text-slate-600 leading-relaxed">
            <p className="text-lg text-slate-700">
              This Privacy Policy explains how your personal and business information is collected, used, disclosed,
              and safeguarded when you access the Baalvion Mining platform (the &quot;Platform&quot;), a B2B mineral
              trade, escrow/settlement, and KYC verification service. Please read this policy carefully.
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">1. Data Controller Identity</h2>
              <p>
                The Platform is operated by <strong>Baalvion Industries Private Limited</strong> (&quot;we&quot;,
                &quot;us&quot;, &quot;our&quot;), the legal entity behind the brand <strong>Baalvion Mining Inc.</strong>,
                a company incorporated in India.
              </p>
              <ul className="list-disc pl-8 space-y-2 text-sm">
                <li><strong>Corporate Identification Number (CIN):</strong> U43121OD2025PTC048479</li>
                <li><strong>Registered Office:</strong> C/o Dilip Kumar Kuldeep, Upper Mania, PO Pakjhola, Semiliguda, Koraput, Odisha &ndash; 764036, India</li>
                <li><strong>Headquarters:</strong> Altamount Road, Lodha Altamount, Mumbai, Maharashtra &ndash; 400026, India</li>
                <li><strong>Email:</strong> trade@baalvion.com &middot; <strong>Phone:</strong> +91 89512 84770</li>
              </ul>
              <p>
                As the entity that determines the purposes and means of processing personal data on the Platform, we
                act as the data fiduciary/controller under the Digital Personal Data Protection Act, 2023 (&quot;DPDP
                Act&quot;) and applicable Indian law.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">2. Information We Collect</h2>
              <p>We collect the following categories of data:</p>
              <ul className="list-disc pl-8 space-y-2 text-sm">
                <li><strong>Account data:</strong> name, business email, phone number, login credentials, role, and organisation profile.</li>
                <li><strong>KYC / identity documentation:</strong> identity documents, proof of incorporation, business licences, authorised-signatory details, and verification records required to onboard your organisation.</li>
                <li><strong>Business &amp; financial data:</strong> trade listings, order and settlement records, bank/payout details, tax registrations, and escrow-related information.</li>
                <li><strong>Usage data:</strong> device and browser information, IP address, log data, and interactions with the Platform collected through cookies and similar technologies.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">3. Purposes &amp; Legal Bases</h2>
              <p>We process your data for the following purposes and on the corresponding legal bases:</p>
              <ul className="list-disc pl-8 space-y-2 text-sm">
                <li><strong>To provide the Platform and perform our agreement with you</strong> &mdash; account creation, trade facilitation, escrow and settlement (performance of contract).</li>
                <li><strong>To verify identity and meet KYC/AML obligations</strong> &mdash; legal obligation and our legitimate interest in preventing fraud.</li>
                <li><strong>To operate, secure, and improve the Platform</strong> &mdash; our legitimate interests, subject to your rights.</li>
                <li><strong>To communicate with you</strong> &mdash; service notices, support, and (where required) your consent for non-essential communications.</li>
              </ul>
              <p>Where the DPDP Act requires consent, we rely on the consent you provide and you may withdraw it at any time.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">4. Cookies &amp; Tracking</h2>
              <p>
                We use cookies and similar technologies to operate the Platform, remember your preferences, and
                understand usage. For full details on categories, retention, and how to manage your choices, see our{" "}
                <Link href="/cookies" className="text-primary font-semibold underline">Cookie Policy</Link>.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">5. Data Sharing &amp; Sub-Processors</h2>
              <p>We do not sell your personal data. We may share data with the following generic categories of recipients, strictly as needed:</p>
              <ul className="list-disc pl-8 space-y-2 text-sm">
                <li>Identity-verification and KYC/AML screening service providers.</li>
                <li>Payment, escrow, and settlement service providers.</li>
                <li>Cloud hosting, storage, and infrastructure providers.</li>
                <li>Analytics, security, and communications service providers.</li>
                <li>Professional advisers, auditors, and regulators or authorities where legally required.</li>
              </ul>
              <p>Sub-processors are bound by contractual obligations to protect your data and process it only on our instructions.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">6. International Transfers</h2>
              <p>
                Where data is transferred or processed outside India, we take steps to ensure such transfers comply
                with the DPDP Act and applicable law, including contractual safeguards with recipients. We do not
                transfer personal data to any jurisdiction restricted by the Government of India.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">7. Data Retention</h2>
              <p>We retain personal data only for as long as necessary for the purposes described above:</p>
              <ul className="list-disc pl-8 space-y-2 text-sm">
                <li><strong>Account and profile data:</strong> for the life of your account and a reasonable period thereafter (typically up to 1&ndash;3 years), unless a longer period is required by law.</li>
                <li><strong>KYC and transaction records:</strong> retained for the period required under applicable AML and record-keeping obligations (commonly 5&ndash;8 years from the end of the business relationship or transaction).</li>
                <li><strong>Usage and log data:</strong> typically retained for a shorter period (often up to 12&ndash;24 months) for security and analytics.</li>
              </ul>
              <p>When data is no longer required, we securely delete or anonymise it.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">8. Security Measures</h2>
              <p>
                We implement reasonable technical and organisational measures to protect your data, including
                encryption in transit and at rest, role-based access controls, network safeguards, and ongoing
                monitoring. No method of transmission or storage is fully secure, and we cannot guarantee absolute
                security.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">9. Your Rights</h2>
              <p>Subject to the DPDP Act and applicable law, you have the right to:</p>
              <ul className="list-disc pl-8 space-y-2 text-sm">
                <li><strong>Access</strong> a summary of the personal data we process about you.</li>
                <li><strong>Correction</strong> of inaccurate or incomplete data.</li>
                <li><strong>Erasure</strong> of your data, subject to legal retention obligations.</li>
                <li><strong>Portability</strong> of certain data you have provided.</li>
                <li><strong>Grievance redressal</strong> and the ability to nominate another person to exercise rights in case of incapacity or death.</li>
              </ul>
              <p>
                To exercise any right, email <strong>trade@baalvion.com</strong> with your request and sufficient detail
                to verify your identity. We will respond within the timeframes required by applicable law.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">10. Grievance Officer</h2>
              <p>
                In accordance with the DPDP Act and the Information Technology Act, 2000 (and the IT Rules, 2021), you
                may contact our Grievance Officer for any concern relating to the processing of your data:
              </p>
              <div className="bg-slate-50 p-6 rounded-xl text-sm space-y-1">
                <p><strong>Grievance Officer (designation)</strong></p>
                <p>Baalvion Industries Private Limited</p>
                <p>C/o Dilip Kumar Kuldeep, Upper Mania, PO Pakjhola, Semiliguda, Koraput, Odisha &ndash; 764036, India</p>
                <p>Email: trade@baalvion.com</p>
              </div>
              <p>We will acknowledge and address grievances within the timeframes prescribed under applicable law.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">11. Children&apos;s Data</h2>
              <p>
                The Platform is intended solely for business (B2B) use by adults authorised to act on behalf of an
                organisation. It is not directed at children, and we do not knowingly collect personal data of
                children. If we learn that we have collected such data, we will delete it.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">12. Breach Notification</h2>
              <p>
                In the event of a personal-data breach, we will assess the incident and notify the relevant Data
                Protection Board and affected individuals where required, in the manner and within the timeframes
                prescribed by the DPDP Act and applicable law.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">13. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Material changes will be communicated through the
                Platform or by other appropriate means. The &quot;Effective Date&quot; above indicates when this
                version took effect.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">14. Contact Us</h2>
              <p>
                For any questions about this Privacy Policy or our data practices, contact Baalvion Industries Private
                Limited at <strong>trade@baalvion.com</strong> or +91 89512 84770.
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
