
import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  ChevronRight,
  Truck,
  RefreshCcw,
  HelpCircle,
  ShieldCheck,
  Clock,
  Package,
  Star,
  Mail,
  FileText,
  Gift,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { CUSTOMER_SERVICE, COUNTRIES } from '@/lib/mock-data';

type CustomerServicePageProps = {
  params: {
    country: string;
  };
};

export async function generateMetadata({ params }: CustomerServicePageProps): Promise<Metadata> {
  const countryCode = (params.country as string) || 'us';
  const currentCountry = COUNTRIES[countryCode] || COUNTRIES.us;

  return {
    title: `Customer Service & Support | AMARISÉ MAISON ${currentCountry.name} Help Center`,
    description: `Get support for orders, shipping, returns, and more in ${currentCountry.name}. Our customer service team is available to assist with all your inquiries.`,
  };
}

export default function CustomerServicePage({ params }: CustomerServicePageProps) {
  const countryCode = (params.country as string) || 'us';
  const info = CUSTOMER_SERVICE[countryCode] || CUSTOMER_SERVICE.us;
  const currentCountry = COUNTRIES[countryCode] || COUNTRIES.us;

  return (
    <div className="animate-fade-in bg-gradient-to-br from-ivory via-white to-ivory min-h-screen">
      {/* Header Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-plum/5 to-gold/5"></div>
        <div className="relative container mx-auto px-6 py-24 lg:py-32 text-center">
          <nav className="flex items-center justify-center space-x-3 text-sm tracking-widest uppercase text-muted-foreground mb-12">
            <Link href={`/${countryCode}`} className="hover:text-plum transition-colors duration-300">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-plum font-semibold">Client Services</span>
          </nav>

          <div className="space-y-8 max-w-5xl mx-auto">
            <div className="inline-flex items-center px-6 py-3 bg-plum/10 rounded-full border border-plum/20">
              <span className="text-plum text-sm font-bold tracking-[0.2em] uppercase">Maison Support</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-headline font-bold italic text-gray-900 leading-tight">
              How May We Assist You?
            </h1>

            <div className="w-24 h-1 bg-gradient-to-r from-plum to-gold mx-auto my-8"></div>

            <p className="text-2xl md:text-3xl text-gray-700 font-light max-w-4xl mx-auto leading-relaxed italic">
              "The excellence of the Maison extends beyond the creation of an artifact. It is found in every interaction with our connoisseurs."
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-6 lg:px-8 space-y-24 pb-32">

        {/* Shipping Section */}
        <section className="space-y-12 mt-12">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-4">
              <Truck className="w-12 h-12 text-plum" />
              <h2 className="text-4xl md:text-5xl font-headline font-bold italic text-plum">
                Global White-Glove Shipping
              </h2>
            </div>
            <p className="text-xl text-plum font-semibold tracking-wide uppercase">{currentCountry.name}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-plum to-plum/80 p-8 text-white">
              <h3 className="text-3xl font-headline font-bold italic mb-4">Local Logistics: {currentCountry.name}</h3>
              <p className="text-lg font-light leading-relaxed opacity-90">
                {info.shipping}
              </p>
            </div>

            <div className="p-4 md:p-12 space-y-12">
              {/* Delivery Timeframes */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-8 h-8 text-gold" />
                    <h4 className="text-2xl font-bold text-gray-900">Delivery Timeframes</h4>
                  </div>
                  <div className="space-y-3 pl-11">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-lg text-gray-700"><strong className="text-plum">Processing Time:</strong> 0–1 business days</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-lg text-gray-700"><strong className="text-plum">Delivery Time:</strong> 2–5 business days within {currentCountry.name}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <ShieldCheck className="w-8 h-8 text-gold" />
                    <h4 className="text-2xl font-bold text-gray-900">Full Insurance</h4>
                  </div>
                  <p className="text-lg text-gray-600 leading-relaxed pl-11 italic">
                    Every artifact is fully insured at its replacement value during transit, ensuring complete protection from dispatch to delivery.
                  </p>
                </div>
              </div>

              {/* Priority Access */}
              <div className="bg-gradient-to-r from-gold/10 to-plum/10 rounded-xl p-8 border border-gold/20">
                <div className="flex items-center space-x-3 mb-4">
                  <Star className="w-8 h-8 text-gold" />
                  <h4 className="text-2xl font-bold text-gray-900">Priority Access</h4>
                </div>
                <p className="text-lg text-gray-600 leading-relaxed italic">
                  Bespoke and VIP clients receive prioritized dispatch and handling from our ateliers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Returns Section */}
        <section className="space-y-12">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-4">
              <RefreshCcw className="w-12 h-12 text-plum" />
              <h2 className="text-4xl md:text-5xl font-headline font-bold italic text-plum">
                Artisanal Returns
              </h2>
            </div>
            <p className="text-xl text-plum font-semibold tracking-wide uppercase">The Return Charter ({currentCountry.name})</p>
            <p className="text-2xl text-gray-700 font-light max-w-3xl mx-auto italic leading-relaxed">
              {info.returns}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Return Window */}
              <div className="p-4 md:p-12 border-r border-gray-100">
                <h3 className="text-3xl font-bold text-gray-900 mb-6">Return Window</h3>
                <p className="text-xl text-gray-600 leading-relaxed italic mb-8">
                  We accept returns for both <span className="text-plum font-semibold">defective and non-defective products within 7 to 15 days</span> of delivery.
                </p>

                <h4 className="text-2xl font-bold text-gray-900 mb-4">Eligibility Criteria</h4>
                <p className="text-lg text-gray-600 italic mb-6">To qualify for a return:</p>
                <ul className="space-y-4">
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    <span className="text-lg text-gray-700">Items must be <strong className="text-plum">unused and in original condition</strong></span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    <span className="text-lg text-gray-700">All original packaging, tags, seals, and certificates must remain intact</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    <span className="text-lg text-gray-700">Proof of purchase must be provided</span>
                  </li>
                </ul>
              </div>

              {/* Return Process */}
              <div className=" p-4 md:p-12 space-y-8">
                <div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-4">Return Method</h4>
                  <p className="text-lg text-gray-600 italic">
                    Returns are accepted <span className="text-plum font-semibold">by mail only</span>.
                  </p>
                </div>

                <div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-4">Return Shipping</h4>
                  <ul className="space-y-3">
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-lg text-gray-700">Return shipping is <strong className="text-plum">free of charge within {currentCountry.name}</strong></span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-lg text-gray-700">A <strong className="text-plum">prepaid return label</strong> is included in the package</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-4">Exchanges</h4>
                  <p className="text-lg text-gray-600 italic">
                    We offer <span className="text-plum font-semibold">product exchanges</span>, subject to stock availability and successful inspection.
                  </p>
                </div>
              </div>
            </div>

            {/* Authenticity Verification & Refunds */}
            <div className="border-t border-gray-100 p-4 md:p-12 space-y-12">
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-6">Authenticity Verification</h4>
                  <p className="text-lg text-gray-600 italic mb-6">
                    All returned items undergo a <span className="text-plum font-semibold">rigorous inspection process</span> by our specialists to verify:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center space-x-3">
                      <ShieldCheck className="w-5 h-5 text-gold flex-shrink-0" />
                      <span className="text-lg text-gray-700">Product integrity</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <ShieldCheck className="w-5 h-5 text-gold flex-shrink-0" />
                      <span className="text-lg text-gray-700">Authenticity</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <ShieldCheck className="w-5 h-5 text-gold flex-shrink-0" />
                      <span className="text-lg text-gray-700">Compliance with return standards</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-6">Refunds</h4>
                  <ul className="space-y-4">
                    <li className="flex items-start space-x-3">
                      <Clock className="w-6 h-6 text-plum flex-shrink-0 mt-1" />
                      <span className="text-lg text-gray-700">Refunds are processed within <strong className="text-plum">5 business days</strong> after the returned item is received and approved</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                      <span className="text-lg text-gray-700">Refunds will be issued to the <strong className="text-plum">original payment method</strong></span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Non-Returnable Conditions */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-8">
                <h4 className="text-2xl font-bold text-red-900 mb-6">Non-Returnable Conditions</h4>
                <p className="text-lg text-red-700 italic mb-6">Returns may not be accepted if:</p>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-3"></div>
                    <span className="text-lg text-red-700">The product has been used, damaged, or altered</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-3"></div>
                    <span className="text-lg text-red-700">Original packaging or tags are missing</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-3"></div>
                    <span className="text-lg text-red-700">The return request is made after the 30-day window</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="space-y-12">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-4">
              <HelpCircle className="w-12 h-12 text-plum" />
              <h2 className="text-4xl md:text-5xl font-headline font-bold italic text-plum">
                Frequently Asked
              </h2>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Book a Viewing */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 text-center space-y-6">
              <div className="w-16 h-16 bg-plum/10 rounded-full flex items-center justify-center mx-auto">
                <Package className="w-8 h-8 text-plum" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">{info.faqs[0]?.question || "Book a Viewing"}</h3>
              <p className="text-xl text-gray-600 leading-relaxed italic">
                {info.faqs[0]?.answer || "Private product viewings and consultations can be arranged upon request."}
              </p>
            </div>

            {/* Direct Inquiries */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 text-center space-y-6">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">Direct Inquiries</h3>
              <p className="text-2xl text-gray-600 leading-relaxed italic mb-8">
                "If your question remains unanswered, our private concierge team is available for a bespoke consultation."
              </p>
             
            </div>
          </div>
        </section>

        {/* Client Resources */}
        <section className="space-y-12">
          <div className="text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-headline font-bold italic text-plum">Client Resources</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our comprehensive guides and services designed to enhance your experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Link href="#" className="group">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center space-y-4 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-plum/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-plum/20 transition-colors">
                  <FileText className="w-8 h-8 text-plum" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-plum transition-colors">Size Guide</h3>
                <p className="text-gray-600 leading-relaxed">Find your perfect fit with our detailed sizing information</p>
              </div>
            </Link>

            <Link href="#" className="group">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center space-y-4 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-gold/20 transition-colors">
                  <Star className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-gold transition-colors">Product Care</h3>
                <p className="text-gray-600 leading-relaxed">Learn how to maintain and preserve your artisanal pieces</p>
              </div>
            </Link>

            <Link href="#" className="group">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center space-y-4 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-plum/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-plum/20 transition-colors">
                  <ShieldCheck className="w-8 h-8 text-plum" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-plum transition-colors">Authenticity Registry</h3>
                <p className="text-gray-600 leading-relaxed">Verify and register your authenticated Maison artifacts</p>
              </div>
            </Link>

            <Link href="#" className="group">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center space-y-4 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-gold/20 transition-colors">
                  <Gift className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-gold transition-colors">Gift Services</h3>
                <p className="text-gray-600 leading-relaxed">Discover our premium gifting and personalization options</p>
              </div>
            </Link>
          </div>
        </section>



      </div>
    </div>
  );
}
