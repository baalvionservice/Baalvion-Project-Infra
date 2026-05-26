import type { Metadata } from 'next';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';
import ContactForm from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact Investor Relations | Institutional Support',
  description: 'Reach out to the Baalvion Investor Relations team for institutional inquiries, shareholder services, and media requests.',
};

export default function ContactIrPage() {
  return (
    <div className="animate-in fade-in duration-700">
      <section className="bg-black text-white py-16 md:py-24 border-b border-white/10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-bold text-primary tracking-[0.2em] mb-4 uppercase">Resources</p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">Contact Investor Relations</h1>
        </div>
      </section>

      <section className="py-20 bg-white text-black">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2">
              <div className="mb-12">
                <h2 className="text-3xl font-bold tracking-tight mb-4">Inquiry Form</h2>
                <p className="text-gray-500">Please provide your institutional details. Our IR team typically responds within 24–48 hours.</p>
              </div>

              <ContactForm />
            </div>

            <aside className="space-y-12">
              <div className="space-y-6">
                <h3 className="text-xl font-bold border-b border-gray-200 pb-4">Corporate Office</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex gap-4">
                    <MapPin className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="font-bold">Baalvion Global Headquarters</p>
                      <address className="not-italic text-gray-600 mt-1">
                        Semiliguda, Koraput<br />
                        Koraput, Orissa<br />
                        India, 764036
                      </address>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <Phone className="h-5 w-5 text-primary" />
                    <p className="font-bold">+91 8951284770</p>
                  </div>
                  <div className="flex gap-4 items-center">
                    <Mail className="h-5 w-5 text-primary" />
                    <p className="font-bold">invrel@baalvion.com</p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-black text-white space-y-4">
                <Globe className="h-8 w-8 text-primary" />
                <h4 className="font-bold text-lg">Global Presence</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Baalvion maintains institutional relations offices in New York, London, Singapore, and Mumbai to support our global shareholder base across all time zones.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
