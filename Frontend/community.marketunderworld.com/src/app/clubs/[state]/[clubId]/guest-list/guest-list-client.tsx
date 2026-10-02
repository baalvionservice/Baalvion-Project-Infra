"use client"

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ChevronRight } from "lucide-react";
import { Club } from "@/data/clubs-data";
import { Breadcrumbs } from "@/components/ui/breadcrumb";

export function GuestListClient({ club, state }: { club: Club, state: string }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateAttending: "",
    males: "0",
    females: "0",
  });
  
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const breadcrumbItems = [
    { label: "Clubs", href: "/clubs" },
    { label: state, href: `/clubs/${state}` },
    { label: `${club.name} Guest List` }
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f7] text-[#222] font-sans">
      <Navbar />

      <main className="container max-w-[1200px] mx-auto px-4 py-8 mt-20">
        
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content Area */}
          <div className="flex-1 bg-white p-6 md:p-10 shadow-sm border border-gray-200">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[#111]">
              {club.name} Guest List
            </h1>
            
            <p className="text-lg text-[#555] mb-8 leading-relaxed">
              Sign up for the free guest list at {club.name}. Please fill out the form below to secure your spot. Note that guest list entry is subject to venue capacity and management discretion.
            </p>
            
            {/* The Form */}
            {submitted ? (
              <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-md">
                <h3 className="text-xl font-bold mb-2">You're on the list!</h3>
                <p>We've received your guest list request for {club.name}. Check your email for the confirmation details.</p>
              </div>
            ) : (
              <div className="bg-[#f9f9f9] border border-gray-200 p-8">
                <h3 className="text-2xl font-bold mb-6 text-center text-[#111]">
                  FREE GUEST LIST SIGNUP
                </h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#444]">First Name *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.firstName}
                        onChange={e => setFormData({...formData, firstName: e.target.value})}
                        className="w-full border border-gray-300 p-3 outline-none focus:border-[#ed6c2a] text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#444]">Last Name *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.lastName}
                        onChange={e => setFormData({...formData, lastName: e.target.value})}
                        className="w-full border border-gray-300 p-3 outline-none focus:border-[#ed6c2a] text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#444]">Email Address *</label>
                      <input 
                        type="email" 
                        required
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full border border-gray-300 p-3 outline-none focus:border-[#ed6c2a] text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#444]">Mobile Phone *</label>
                      <input 
                        type="tel" 
                        required
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full border border-gray-300 p-3 outline-none focus:border-[#ed6c2a] text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#444]">Date Attending *</label>
                    <input 
                      type="date" 
                      required
                      value={formData.dateAttending}
                      onChange={e => setFormData({...formData, dateAttending: e.target.value})}
                      className="w-full border border-gray-300 p-3 outline-none focus:border-[#ed6c2a] text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Select the date you wish to attend {club.name}.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#444]">Males in Party *</label>
                      <select 
                        required
                        value={formData.males}
                        onChange={e => setFormData({...formData, males: e.target.value})}
                        className="w-full border border-gray-300 p-3 outline-none focus:border-[#ed6c2a] text-sm bg-white"
                      >
                        {[...Array(11).keys()].map(n => (
                          <option key={`m-${n}`} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#444]">Females in Party *</label>
                      <select 
                        required
                        value={formData.females}
                        onChange={e => setFormData({...formData, females: e.target.value})}
                        className="w-full border border-gray-300 p-3 outline-none focus:border-[#ed6c2a] text-sm bg-white"
                      >
                        {[...Array(11).keys()].map(n => (
                          <option key={`f-${n}`} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-[#ed6c2a] hover:bg-[#d85e21] text-white font-bold text-lg py-4 transition-colors uppercase tracking-widest mt-4"
                  >
                    Submit Guest List
                  </button>

                </form>
              </div>
            )}
            
            {/* Additional Info below form like in LVNC */}
            <div className="mt-12 space-y-6">
              <h2 className="text-2xl font-bold text-[#111]">How The {club.name} Guest List Works</h2>
              <p className="text-[#555] leading-relaxed">
                Being on the guest list at {club.name} offers free or discounted entry, depending on the event and ratio of your group. We recommend arriving early as entry is strictly based on venue capacity.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-[#555]">
                <li><strong>Dress Code:</strong> Strictly enforced. Upscale nightlife attire required.</li>
                <li><strong>Arrival Time:</strong> We recommend arriving at least 30 minutes before opening.</li>
                <li><strong>Identification:</strong> Valid, physical government-issued ID or passport required.</li>
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-[320px] space-y-8">
            <div className="bg-white p-6 shadow-sm border border-gray-200">
              <h4 className="text-sm font-bold uppercase tracking-widest text-center border-b border-gray-100 pb-4 mb-4">
                Club Info
              </h4>
              <img src={club.image} alt={club.name} className="w-full h-auto mb-4" />
              <div className="space-y-3 text-sm text-[#555]">
                <p><strong>City:</strong> {club.city}</p>
                <p><strong>Music:</strong> {club.musicType.join(", ")}</p>
                <p><strong>Open:</strong> {club.daysOpen}</p>
              </div>
            </div>

            <div className="bg-white p-6 shadow-sm border border-gray-200 text-center">
              <h4 className="text-sm font-bold uppercase tracking-widest border-b border-gray-100 pb-4 mb-4">
                VIP Tables
              </h4>
              <p className="text-sm text-[#555] mb-4">
                Want to skip the line entirely? Book a VIP Table with bottle service.
              </p>
              <Link
                href={`/clubs/${state}/${club.id}/vip-tables`}
                className="block w-full bg-[#222] hover:bg-[#000] text-white font-bold py-3 text-sm transition-colors uppercase text-center"
              >
                Book Bottle Service
              </Link>
            </div>
          </aside>

        </div>
      </main>

      <Footer />
    </div>
  );
}
