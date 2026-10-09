"use client"

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ChevronLeft, Check } from "lucide-react";
import { submitVipTable, type ClubEvent } from "@/lib/api/nightlife";

export function EventClient({ event }: { event: ClubEvent }) {
  const [guestListOpen, setGuestListOpen] = useState(true);
  const [vipTablesOpen, setVipTablesOpen] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    date: event.date,
    males: "0",
    females: "0",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const guests = Number(formData.males) + Number(formData.females);
    if (guests < 1) return setError("Add at least one guest.");
    const [firstName, ...rest] = formData.name.trim().split(/\s+/);
    setSubmitting(true);
    try {
      await submitVipTable(event.clubId, {
        firstName,
        lastName: rest.join(" ") || "-",
        email: formData.email,
        phone: formData.phone,
        visitDate: event.date,
        groupSize: guests,
        notes: `Enquiry from event page: ${event.eventName}`,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f7] text-[#222] font-sans">
      <Navbar />

      <main className="container max-w-[1000px] mx-auto px-4 py-8 mt-20">
        
        {/* Back Link */}
        <div className="mb-6 border-b border-gray-200 pb-4">
          <Link href="/calendar" className="text-[#333] hover:text-[#ed6c2a] font-bold text-[18px] flex items-center gap-2 transition-colors">
            <ChevronLeft className="w-5 h-5" /> Return to all events.
          </Link>
        </div>

        <div className="bg-white p-6 md:p-8 shadow-sm border border-gray-200">
          
          <h1 className="text-3xl font-bold uppercase tracking-wide text-[#333] mb-8">
            <Link href={`/clubs/${event.city.toLowerCase()}`} className="hover:text-[#ed6c2a] transition-colors">
              {event.venue}
            </Link>
          </h1>

          <div className="flex flex-col md:flex-row gap-8">
            
            {/* Left Column: Image and Details */}
            <div className="w-full md:w-[35%] space-y-6">
              <div className="w-full relative">
                <img src={event.image} alt={event.eventName} className="w-full h-auto" />
              </div>

              <div className="bg-white">
                <h2 className="text-[22px] font-bold text-[#111] mb-4 leading-tight">{event.eventName}</h2>
                <ul className="space-y-2 text-[14px]">
                  {event.tag === "FREE ON GUEST LIST" && (
                    <li className="font-bold text-[#111] pb-2">
                      <span className="mr-1">🔥</span> FREE ON GUEST LIST
                    </li>
                  )}
                  {event.tag === "SOLD OUT" && <li className="font-bold text-red-600 pb-2">SOLD OUT</li>}
                  {event.ticketUrl && event.tag !== "SOLD OUT" && (
                    <li className="pb-2"><a href={event.ticketUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-[#f96a30] hover:bg-[#e05520] text-black font-bold text-xs px-4 py-2 uppercase">Buy tickets</a></li>
                  )}
                  <li><b className="text-[#111]">Date:</b> {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
                  <li><b className="text-[#111]">Location:</b> {event.venue}, {event.city}</li>
                  {event.djName && <li><b className="text-[#111]">DJ:</b> {event.djName}</li>}
                </ul>
              </div>
            </div>

            {/* Right Column: Accordions */}
            <div className="w-full md:w-[65%] space-y-6">
              
              {/* Join Guest List Accordion */}
              <div className="border border-gray-200">
                <button 
                  onClick={() => setGuestListOpen(!guestListOpen)}
                  className="w-full bg-[#f8f9fa] p-4 flex justify-between items-center text-left hover:bg-gray-100 transition-colors"
                >
                  <span className="font-bold text-[16px] text-[#333]">Join The Guest List</span>
                  <span className="text-gray-400 font-bold">{guestListOpen ? "−" : "+"}</span>
                </button>
                
                {guestListOpen && (
                  <div className="p-6 text-center border-t border-gray-200 bg-white">
                    <p className="text-[#555] mb-4">Click the button below to join our FREE guest list at {event.venue}.</p>
                    <Link 
                      href={`/clubs/${event.city.toLowerCase()}/${event.clubId}/guest-list`}
                      className="inline-block bg-[#f96a30] hover:bg-[#e05520] text-black font-bold text-sm px-8 py-3 transition-colors uppercase"
                    >
                      GO TO GUEST LIST SIGN UP
                    </Link>
                  </div>
                )}
              </div>

              {/* Table Reservations Banner CTA */}
              <div className="bg-[#f0f4f8] border border-blue-100 p-6 text-center">
                <p className="text-[#333] mb-4 text-[15px]">
                  Explore our interactive table options to compare locations, group sizes and starting minimums.
                </p>
                <Link 
                  href={`/clubs/${event.city.toLowerCase()}/${event.clubId}/vip-tables`}
                  className="inline-block border-2 border-[#111] hover:bg-[#111] hover:text-white text-[#111] font-bold text-[12px] px-6 py-3 transition-colors uppercase tracking-widest"
                >
                  VIEW TABLE LOCATIONS & PRICING
                </Link>
              </div>

              {/* VIP Tables & Bottle Service Accordion */}
              <div className="border border-gray-200">
                <button 
                  onClick={() => setVipTablesOpen(!vipTablesOpen)}
                  className="w-full bg-[#f8f9fa] p-4 flex justify-between items-center text-left hover:bg-gray-100 transition-colors"
                >
                  <span className="font-bold text-[16px] text-[#333]">VIP Tables & Bottle Service</span>
                  <span className="text-gray-400 font-bold">{vipTablesOpen ? "−" : "+"}</span>
                </button>
                
                {vipTablesOpen && (
                  <div className="p-6 border-t border-gray-200 bg-white">
                    <p className="text-[#555] mb-6 text-center text-sm">
                      Send a table enquiry to {event.venue}. The venue confirms availability and pricing with you directly.
                    </p>
                    
                    {submitted ? (
                      <div className="bg-green-50 border border-green-200 text-green-800 p-4 text-center">
                        <Check className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        <h4 className="font-bold">Request Sent</h4>
                        <p className="text-sm mt-1">The venue will contact you to confirm. Nothing is reserved or charged yet.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input 
                            type="text" required placeholder="Full Name*" 
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-[#303030] text-white border-0 p-3 text-[14px] outline-none focus:ring-1 focus:ring-[#ed6c2a] placeholder:text-gray-400"
                          />
                          <input 
                            type="tel" required placeholder="Cell Number*" 
                            value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full bg-[#303030] text-white border-0 p-3 text-[14px] outline-none focus:ring-1 focus:ring-[#ed6c2a] placeholder:text-gray-400"
                          />
                        </div>
                        <input 
                          type="email" required placeholder="Your Email*" 
                          value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                          className="w-full bg-[#303030] text-white border-0 p-3 text-[14px] outline-none focus:ring-1 focus:ring-[#ed6c2a] placeholder:text-gray-400"
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="w-full bg-[#303030] text-gray-400 border-0 p-3 text-[14px]">
                            Date: {new Date(event.date).toLocaleDateString()}
                          </div>
                          <div className="flex gap-3">
                            <select 
                              value={formData.males} onChange={e => setFormData({...formData, males: e.target.value})}
                              className="w-full bg-[#303030] text-white border-0 p-3 text-[14px] outline-none focus:ring-1 focus:ring-[#ed6c2a]"
                            >
                              <option value="0">0 Guys</option>
                              {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} {n===1?'Guy':'Guys'}</option>)}
                            </select>
                            <select 
                              value={formData.females} onChange={e => setFormData({...formData, females: e.target.value})}
                              className="w-full bg-[#303030] text-white border-0 p-3 text-[14px] outline-none focus:ring-1 focus:ring-[#ed6c2a]"
                            >
                              <option value="0">0 Girls</option>
                              {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} {n===1?'Girl':'Girls'}</option>)}
                            </select>
                          </div>
                        </div>

                        {error && <p role="alert" className="text-sm text-red-600 font-medium">{error}</p>}
                        <button 
                          type="submit"
                          disabled={submitting}
                          className="w-full bg-[#f96a30] hover:bg-[#e05520] disabled:opacity-60 text-black font-bold text-[15px] py-3 transition-colors mt-2"
                        >
                          {submitting ? "Sending..." : "Send Enquiry"}
                        </button>
                        <p className="text-[11px] text-gray-500 text-center mt-2">
                          Your information is secure and will never be shared.
                        </p>
                      </form>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
