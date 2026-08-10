"use client";

import React from 'react';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { Mail, MessageSquare, ShieldCheck, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ContactUsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-4xl">
          
          <header className="mb-16 text-center">
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-6 leading-tight">
              Contact Us
            </h1>
            <p className="text-xl text-slate-500 font-medium italic max-w-xl mx-auto">
              Reach the right team below, or send a general inquiry — we read everything and respond as quickly as we can.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            <ContactCard
              icon={<Mail className="w-6 h-6" />}
              title="General & Membership"
              contact="concierge@lawelitenetwork.com"
              desc="Account questions, memberships, and consultations."
            />
            <ContactCard
              icon={<MessageSquare className="w-6 h-6" />}
              title="Editorial Inquiries"
              contact="editorial@lawelitenetwork.com"
              desc="Questions or feedback about our articles and guides."
            />
            <ContactCard
              icon={<Globe className="w-6 h-6" />}
              title="Press"
              contact="press@lawelitenetwork.com"
              desc="Media inquiries."
            />
            <ContactCard
              icon={<ShieldCheck className="w-6 h-6" />}
              title="Privacy & Legal"
              contact="legal@lawelitenetwork.com"
              desc="Privacy questions and legal or regulatory correspondence."
            />
          </div>

          <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden">
             <div className="absolute top-0 left-0 p-8 opacity-10"><ShieldCheck className="w-24 h-24" /></div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-center">
               <div>
                 <h3 className="text-2xl font-bold font-serif italic mb-4">Headquarters</h3>
                 <p className="text-slate-400 font-medium leading-relaxed">
                   Yeshwant Avenue Building, NX, NX Road<br />
                   Y K Nagar, Virar West, Virar<br />
                   Maharashtra 401303, India<br />
                   <a href="tel:+918951284770" className="hover:text-white transition-colors">+91 89512 84770</a>
                 </p>
               </div>
               <div>
                 <h3 className="text-2xl font-bold font-serif italic mb-4">Registered Office</h3>
                 <p className="text-slate-400 font-medium leading-relaxed">
                   C/o Dilip Kumar Kuldeep, Upper Mania<br />
                   Po- Pakjhola, Semiliguda<br />
                   Koraput, Odisha 764036, India<br />
                   CIN: U43121OD2025PTC048479
                 </p>
               </div>
             </div>
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function ContactCard({ icon, title, contact, desc }: any) {
  return (
    <div className="p-8 border border-slate-100 rounded-[2rem] bg-slate-50/50 hover:shadow-xl transition-all group">
      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-blue-600 mb-6 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">{icon}</div>
      <h4 className="text-xl font-bold text-slate-900 mb-2">{title}</h4>
      <p className="text-blue-600 font-bold mb-4">{contact}</p>
      <p className="text-sm text-slate-500 italic font-medium">{desc}</p>
    </div>
  );
}
