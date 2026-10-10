"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Building, 
  DollarSign, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  Star, 
  Sparkles,
  SlidersHorizontal,
  Send,
  UserCheck,
  Award
} from "lucide-react";

interface IncomingRequest {
  id: string;
  clientName: string;
  sessionType: string;
  city: "Mumbai" | "Delhi NCR" | "Bangalore";
  dateRequested: string;
  hours: number;
  totalUsdt: number;
  totalInr: number;
  status: "pending" | "accepted" | "declined";
}

export default function FounderIndividualDashboard() {
  const [activeTab, setActiveTab] = useState<"requests" | "settings" | "active">("requests");

  // Founder Profile Controls
  const [hourlyRate, setHourlyRate] = useState<number>(200);
  const [selectedCities, setSelectedCities] = useState<string[]>(["Mumbai", "Delhi NCR"]);
  const [availabilityNote, setAvailabilityNote] = useState<string>("Available Weekend Evenings (Bastian BKC / Aerocity)");

  // Mock Incoming Requests
  const [requests, setRequests] = useState<IncomingRequest[]>([
    {
      id: "REQ-801",
      clientName: "Ananya Sharma",
      sessionType: "VIP 5-Star Dinner Date",
      city: "Mumbai",
      dateRequested: "2026-10-14 (8:00 PM)",
      hours: 2,
      totalUsdt: 400,
      totalInr: 36000,
      status: "pending"
    },
    {
      id: "REQ-802",
      clientName: "Rhea Kapoor",
      sessionType: "Coffee & Startup Pitch Mentorship",
      city: "Delhi NCR",
      dateRequested: "2026-10-15 (4:00 PM)",
      hours: 1,
      totalUsdt: 200,
      totalInr: 18000,
      status: "pending"
    }
  ]);

  const handleAccept = (id: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: "accepted" } : r));
    alert("Booking accepted! Client has been notified and escrow is locked.");
  };

  const handleDecline = (id: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: "declined" } : r));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 text-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-950 text-amber-400 border border-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-amber-400" /> Founder Portal • Executive Control
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            Founder Individual Dashboard <span className="text-xs text-zinc-500 font-mono">Tier-1 Target Hubs</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Manage your hourly rental rates, accept/decline date booking requests, and collect escrow payouts for Mumbai, Delhi & Bangalore.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-zinc-900 p-3 rounded-xl border border-zinc-800">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <div>
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">Security Collateral</div>
            <div className="text-sm font-bold text-emerald-400">$1,000 USDT Vault Locked</div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <div className="text-zinc-400 text-xs uppercase font-semibold mb-1">Total Escrow Earnings</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">$7,600 USDT</div>
          <div className="text-[11px] text-zinc-500 mt-1">≈ ₹6,84,000 INR Paid Out</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <div className="text-zinc-400 text-xs uppercase font-semibold mb-1">Completed Date Sessions</div>
          <div className="text-2xl font-bold text-white font-mono">38 Dates</div>
          <div className="text-[11px] text-zinc-500 mt-1">100% Client Satisfaction</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <div className="text-zinc-400 text-xs uppercase font-semibold mb-1">Current Hourly Rate</div>
          <div className="text-2xl font-bold text-amber-400 font-mono">${hourlyRate} USDT</div>
          <div className="text-[11px] text-zinc-500 mt-1">₹{(hourlyRate * 90).toLocaleString()} INR / hr</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <div className="text-zinc-400 text-xs uppercase font-semibold mb-1">Founder Rating</div>
          <div className="text-2xl font-bold text-amber-400 font-mono flex items-center gap-1">
            <Star className="w-5 h-5 fill-amber-400" /> 4.9 / 5.0
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Top 5% Founder Rank</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-zinc-800 mb-8">
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-5 py-3 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === "requests" ? "border-amber-500 text-white" : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          Incoming Requests ({requests.filter(r => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-5 py-3 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === "settings" ? "border-amber-500 text-white" : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          Rate & City Settings
        </button>
      </div>

      {/* TAB 1: INCOMING REQUESTS QUEUE */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-2">Pending Date Booking Requests</h2>
            <p className="text-xs text-zinc-400 mb-6">
              Clients have requested date sessions with you. Escrow funds will be released to your wallet upon date completion.
            </p>

            <div className="space-y-4">
              {requests.map((r) => (
                <div key={r.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-white">{r.clientName}</span>
                      <span className="bg-rose-950 text-rose-400 border border-rose-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                        {r.sessionType}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-400 font-mono">
                      Target Hub: <strong className="text-white">{r.city}</strong> • Scheduled: {r.dateRequested} ({r.hours} hours)
                    </div>

                    <div className="text-xs text-emerald-400 font-bold font-mono">
                      Escrow Escrow Fee: ${r.totalUsdt} USDT (₹{r.totalInr.toLocaleString()} INR)
                    </div>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    {r.status === "pending" ? (
                      <>
                        <button
                          onClick={() => handleAccept(r.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex-1 md:flex-none transition-colors"
                        >
                          Accept Booking
                        </button>
                        <button
                          onClick={() => handleDecline(r.id)}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-4 py-2 rounded-xl text-xs flex-1 md:flex-none transition-colors"
                        >
                          Decline
                        </button>
                      </>
                    ) : (
                      <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs px-3 py-1.5 rounded-xl font-bold">
                        ✓ Booking Accepted
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRICING & CITY AVAILABILITY SETTINGS */}
      {activeTab === "settings" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-2xl space-y-6">
          <h2 className="text-lg font-bold text-white">Founder Profile & Rental Settings</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 font-semibold mb-1">Hourly Rental Rate (USDT)</label>
              <input 
                type="number" 
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white font-mono font-bold"
              />
              <div className="text-xs text-emerald-400 font-mono mt-1">
                Client Pays: ₹{(hourlyRate * 90).toLocaleString()} INR per hour
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 font-semibold mb-2">Target Tier-1 Available Cities</label>
              <div className="flex flex-wrap gap-2">
                {["Mumbai", "Delhi NCR", "Bangalore"].map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      if (selectedCities.includes(city)) {
                        setSelectedCities(selectedCities.filter(c => c !== city));
                      } else {
                        setSelectedCities([...selectedCities, city]);
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedCities.includes(city) ? "bg-amber-950 border-amber-500 text-amber-300" : "bg-zinc-950 border-zinc-800 text-zinc-500"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 font-semibold mb-1">Availability Note & Preferred Venues</label>
              <textarea 
                rows={2}
                value={availabilityNote}
                onChange={(e) => setAvailabilityNote(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white"
              />
            </div>

            <button
              onClick={() => alert("Settings saved successfully!")}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-xl transition-colors text-xs"
            >
              Save Profile Settings
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
