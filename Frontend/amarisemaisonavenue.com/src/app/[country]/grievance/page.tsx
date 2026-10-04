import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { COUNTRIES } from '@/lib/mock-data';

type PageProps = { params: Promise<{ country: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const country = COUNTRIES[(await params).country] || COUNTRIES.us;
  return {
    title: "Grievance Redressal | AMARISÉ MAISON " + country.name,
    description: "How to raise a complaint about Amarisé Maison Avenue, who receives it, and how quickly it is answered.",
  };
}

export default async function GrievancePage({ params }: PageProps) {
  const countryCode = (await params).country || 'us';
  const country = COUNTRIES[countryCode] || COUNTRIES.us;

  return (
    <div className="animate-fade-in bg-white min-h-screen">
      <div className="container mx-auto px-6 py-24 max-w-3xl">
        <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-10">
          <Link href={`/${countryCode}`} className="hover:text-plum transition-colors">Maison</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-plum">Grievance Redressal</span>
        </div>

        <h1 className="text-5xl font-headline font-bold italic tracking-tight mb-3">Grievance Redressal</h1>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">
          Storefront: {country.name} · Last updated October 4, 2026
        </p>
        <p className="text-md text-gray-600 font-light leading-relaxed mb-16">How to raise a complaint about Amarisé Maison Avenue, who receives it, and how quickly it is answered.</p>

        <div className="space-y-12">
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">1. Who we are</h2>
            <p className="text-md text-gray-600 font-light leading-relaxed">Amarisé Maison Avenue is operated by Baalvion Industries Private Limited (CIN U43121OD2025PTC048479), a company incorporated in India. This page sets out our grievance redressal mechanism in line with the Consumer Protection (E-Commerce) Rules, 2020 and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.</p>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">2. Grievance Officer</h2>
            <ul className="list-disc pl-6 space-y-2 text-md text-gray-600 font-light leading-relaxed">
              <li>Designation: Grievance Officer, Baalvion Industries Private Limited</li>
              <li>Email: legal@baalvion.com</li>
              <li>Phone: +91 89512 84770</li>
              <li>Post: Yeshwant Avenue Building, NX Road, Y K Nagar, Virar West, Virar, Maharashtra 401303, India</li>
            </ul>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">3. How to file a complaint</h2>
            <p className="text-md text-gray-600 font-light leading-relaxed">Email the Grievance Officer with the details below. A complaint that arrives with these details can be investigated straight away; one that does not will cost you a round-trip of questions.</p>
            <ul className="list-disc pl-6 space-y-2 text-md text-gray-600 font-light leading-relaxed">
              <li>Your name and the email address registered on your account</li>
              <li>Order, invoice or payment reference (for payment issues, the gateway transaction ID)</li>
              <li>A description of the problem and what outcome you are asking for</li>
              <li>Screenshots or documents that support the complaint, if you have them</li>
            </ul>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">4. What happens next</h2>
            <ul className="list-disc pl-6 space-y-2 text-md text-gray-600 font-light leading-relaxed">
              <li>We acknowledge every complaint within 48 hours of receiving it and give you a reference number.</li>
              <li>We aim to resolve it, or tell you plainly why we cannot, within 30 days of receipt.</li>
              <li>Payment and refund complaints are prioritised. A confirmed double charge or a failed-payment debit is reversed to the original payment method.</li>
            </ul>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">5. If you are not satisfied</h2>
            <p className="text-md text-gray-600 font-light leading-relaxed">If the outcome does not resolve your complaint, reply to the same thread and ask for escalation to a director of the company. You may also approach the National Consumer Helpline (1915, consumerhelpline.gov.in) or the consumer forum with jurisdiction over your place of residence.</p>
            <p className="text-md text-gray-600 font-light leading-relaxed">For a payment that your bank or card issuer has debited but not credited to us, you can also raise the matter with your bank under the RBI framework for failed transactions.</p>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">Operator</h2>
            <p className="text-md text-gray-600 font-light leading-relaxed">Baalvion Industries Private Limited, CIN U43121OD2025PTC048479, GSTIN 21AANCB3490M1ZF. Registered office: C/o Dilip Kumar Kuldeep, Upper Mania, PO Pakjhola, Semiliguda, Koraput, Odisha 764036, India. Operating office: Yeshwant Avenue Building, NX Road, Y K Nagar, Virar West, Virar, Maharashtra 401303, India. Phone +91 89512 84770. Email support@baalvion.com.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
