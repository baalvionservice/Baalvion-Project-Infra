"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  MessageSquare, 
  QrCode, 
  Star, 
  AlertCircle,
  CheckCircle,
  FileUp,
  X,
  Send,
  Building,
  Heart
} from "lucide-react";

interface BookingItem {
  id: string;
  founderName: string;
  founderCompany: string;
  avatarUrl: string;
  city: "Mumbai" | "Delhi NCR" | "Bangalore";
  sessionType: string;
  dateScheduled: string;
  timeSlot: string;
  hours: number;
  totalUsdt: number;
  totalInr: number;
  status: "payment_pending" | "confirmed" | "completed" | "cancelled";
  upiId: string;
  chatMessages: { sender: string; text: string; time: string }[];
}

const MOCK_CLIENT_BOOKINGS: BookingItem[] = [
  {
    id: "BKG-901",
    founderName: "Vikram Singhania",
    founderCompany: "Nexus AI Protocol ($25M)",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
    city: "Mumbai",
    sessionType: "VIP 5-Star Dinner Date",
    dateScheduled: "2026-10-14",
    timeSlot: "8:00 PM - 10:00 PM",
    hours: 2,
    totalUsdt: 400,
    totalInr: 36000,
    status: "confirmed",
    upiId: "vikram.nexus@icici",
    chatMessages: [
      { sender: "Vikram", text: "Looking forward to our dinner date at Bastian BKC on Saturday!", time: "05:20 PM" },
      { sender: "You", text: "Excited! See you at 8 PM.", time: "05:22 PM" }
    ]
  },
  {
    id: "BKG-902",
    founderName: "Marcus Vance",
    founderCompany: "Underworld Pay ($18M)",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
    city: "Bangalore",
    sessionType: "Coffee & Pitch Mentorship",
    dateScheduled: "2026-10-16",
    timeSlot: "4:00 PM - 5:00 PM",
    hours: 1,
    totalUsdt: 150,
    totalInr: 13500,
    status: "payment_pending",
    upiId: "marcus.pay@okaxis",
    chatMessages: [
      { sender: "System", text: "Booking created. Please scan PhonePe QR code to lock escrow.", time: "Just now" }
    ]
  }
];

export default function ClientBookingsDashboard() {
  const [bookings, setBookings] = useState<BookingItem[]>(MOCK_CLIENT_BOOKINGS);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem>(MOCK_CLIENT_BOOKINGS[0]);

  // QR Modal
  const [showQr, setShowQr] = useState(false);
  const [utrInput, setUtrInput] = useState("");
  const [chatInput, setChatInput] = useState("");

  const handleSendChat = () => {
    if (!chatInput.trim() || !selectedBooking) return;

    const newMsg = { sender: "You", text: chatInput.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    
    setSelectedBooking((prev) => ({
      ...prev,
      chatMessages: [...prev.chatMessages, newMsg]
    }));

    setChatInput("");
  };

  const handlePayConfirm = () => {
    if (!utrInput.trim()) return;

    setSelectedBooking((prev) => ({ ...prev, status: "confirmed" }));
    setShowQr(false);
    setUtrInput("");
  };

  return (
    <div className="max-w-7xl mx-auto p-6 text-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-rose-950 text-rose-400 border border-rose-800 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Client Date Workspace
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            My Founder Bookings <span className="text-xs text-zinc-500 font-mono">Mumbai • Delhi • Bangalore</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Track upcoming dates, scan PhonePe/GPay escrow payment QR codes, and chat directly with booked founders.
          </p>
        </div>

        <Link
          href="/dating"
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-xs flex items-center gap-2"
        >
          <Heart className="w-4 h-4" /> Book New Founder
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Bookings Directory */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <h2 className="font-bold text-white text-base mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-rose-500" /> Active Date Sessions ({bookings.length})
          </h2>

          {bookings.map((b) => (
            <div
              key={b.id}
              onClick={() => setSelectedBooking(b)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedBooking.id === b.id 
                  ? "bg-zinc-950 border-rose-500/80 shadow-lg shadow-rose-950/20" 
                  : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <img src={b.avatarUrl} alt={b.founderName} className="w-10 h-10 rounded-xl object-cover border border-rose-500/40" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-white truncate">{b.founderName}</h4>
                  <p className="text-xs text-zinc-400 truncate">{b.founderCompany}</p>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs pt-2 border-t border-zinc-800/60">
                <span className="text-rose-400 font-semibold">{b.city} • {b.sessionType}</span>
                <span className="font-bold font-mono text-emerald-400">${b.totalUsdt} USDT</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right 2 Columns: Active Session Details & Chat */}
        {selectedBooking && (
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col h-[75vh] overflow-hidden">
            
            {/* Session Header */}
            <div className="p-5 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <img src={selectedBooking.avatarUrl} alt={selectedBooking.founderName} className="w-12 h-12 rounded-2xl object-cover border border-rose-500/50" />
                <div>
                  <h3 className="font-bold text-base text-white">{selectedBooking.founderName}</h3>
                  <p className="text-xs text-rose-400 font-semibold">{selectedBooking.founderCompany} • <span className="text-zinc-400">{selectedBooking.city}</span></p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedBooking.status === "payment_pending" ? (
                  <button
                    onClick={() => setShowQr(true)}
                    className="bg-purple-950 hover:bg-purple-900 border border-purple-800 text-purple-300 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <QrCode className="w-4 h-4 text-purple-400" /> Pay Escrow via PhonePe / GPay
                  </button>
                ) : (
                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Escrow Confirmed
                  </span>
                )}
              </div>
            </div>

            {/* Session Details Bar */}
            <div className="p-4 bg-zinc-950/80 border-b border-zinc-800 flex flex-wrap justify-between items-center text-xs">
              <div>
                <span className="text-zinc-400">Scheduled: </span>
                <strong className="text-white">{selectedBooking.dateScheduled} • {selectedBooking.timeSlot} ({selectedBooking.hours} hrs)</strong>
              </div>
              <div>
                <span className="text-zinc-400">Total Escrow Fee: </span>
                <strong className="text-emerald-400 font-bold text-sm">₹{selectedBooking.totalInr.toLocaleString()} INR (${selectedBooking.totalUsdt} USDT)</strong>
              </div>
            </div>

            {/* Chat Stream */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-zinc-900/40">
              <div className="text-center text-[11px] text-zinc-500 border-b border-zinc-800 pb-3">
                🔒 Private Encrypted Escrow Chat • Date Confirmed in {selectedBooking.city}
              </div>

              {selectedBooking.chatMessages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.sender === 'You' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-zinc-500 mb-0.5">{m.sender} • {m.time}</span>
                  <div className={`p-3 rounded-2xl max-w-[80%] text-xs ${m.sender === 'You' ? 'bg-rose-600 text-white rounded-br-none' : 'bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-bl-none'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder={`Type private message to ${selectedBooking.founderName}...`}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              />
              <button onClick={handleSendChat} className="bg-rose-600 hover:bg-rose-700 text-white p-2.5 rounded-xl transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pay Escrow QR Modal */}
      {showQr && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 text-white text-center relative">
            <button onClick={() => setShowQr(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-lg mb-1">Pay Escrow via PhonePe / GPay</h3>
            <p className="text-xs text-zinc-400 mb-4">Scan QR to transfer ₹{selectedBooking.totalInr.toLocaleString()} INR to platform Escrow.</p>

            <div className="bg-white p-4 rounded-xl inline-block mb-4 shadow-xl border-4 border-purple-900">
              <QrCode className="w-36 h-36 text-black" />
            </div>

            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Enter 12-digit UTR reference number..." 
                value={utrInput}
                onChange={(e) => setUtrInput(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white font-mono"
              />
              <button onClick={handlePayConfirm} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors text-xs">
                Confirm Payment & Lock Escrow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
