"use client";

import React, { useState } from 'react';
import { LifeBuoy, Search, MessageSquare, Clock, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';

const MOCK_TICKETS = [
  { id: "TKT-3301", user: "angry_buyer99", subject: "I paid but never received my files", category: "Purchase Issue", priority: "High", status: "Open", date: "2026-10-02", messages: 2 },
  { id: "TKT-3302", user: "new_user_84", subject: "Cannot access premium area after upgrade", category: "Access Problem", priority: "Medium", status: "In Progress", date: "2026-10-02", messages: 5 },
  { id: "TKT-3303", user: "seller_dispute", subject: "Buyer is threatening chargeback without reason", category: "Dispute", priority: "High", status: "Open", date: "2026-10-01", messages: 1 },
  { id: "TKT-3304", user: "crypto_sender", subject: "Sent wrong USDT network — TRC20 vs ERC20", category: "Payment Issue", priority: "Low", status: "Resolved", date: "2026-09-30", messages: 8 },
];

function priorityClass(priority: string) {
  if (priority === 'High') return 'bg-red-500/10 text-red-400 border border-red-500/20';
  if (priority === 'Medium') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
}

function statusClass(status: string) {
  if (status === 'Open') return 'bg-red-500/10 text-red-400 border border-red-500/20';
  if (status === 'In Progress') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  if (status === 'Resolved') return 'bg-green-500/10 text-green-400 border border-green-500/20';
  return 'bg-white/10 text-gray-400';
}

type Ticket = typeof MOCK_TICKETS[0];

export default function SupportTickets() {
  const [tickets, setTickets] = useState(MOCK_TICKETS);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");

  const resolveTicket = (id: string) => {
    setTickets(tickets.map(t => t.id === id ? { ...t, status: "Resolved" } : t));
    setSelected(prev => prev?.id === id ? { ...prev, status: "Resolved" } : prev);
  };

  const sendReply = () => {
    if (!reply.trim() || !selected) return;
    setReply("");
    alert("Reply sent to user.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <LifeBuoy className="w-6 h-6 text-blue-400" />
          Support Tickets
        </h1>
        <p className="text-sm text-gray-400 mt-1">Reply to and resolve user support requests.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Ticket List */}
        <div className="lg:col-span-2 bg-[#121217] border border-white/5 rounded-xl overflow-hidden flex flex-col" style={{ height: '700px' }}>
          <div className="p-4 border-b border-white/5 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search tickets..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {tickets.map(ticket => (
              <button
                key={ticket.id}
                onClick={() => setSelected(ticket)}
                className={`w-full text-left p-4 hover:bg-white/5 transition-colors ${selected?.id === ticket.id ? 'bg-white/10' : ''}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-bold text-white text-sm truncate">{ticket.subject}</span>
                  <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${priorityClass(ticket.priority)}`}>{ticket.priority}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${statusClass(ticket.status)}`}>{ticket.status}</span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span>{ticket.user}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{ticket.messages}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ticket.date}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Ticket Detail */}
        <div className="lg:col-span-3 bg-[#121217] border border-white/5 rounded-xl flex flex-col" style={{ height: '700px' }}>
          {selected ? (
            <>
              <div className="p-5 border-b border-white/5 shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-mono text-xs text-gray-500 mb-1">{selected.id}</div>
                    <h2 className="text-lg font-bold text-white">{selected.subject}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-fuchsia-400 font-bold">{selected.user}</span>
                      <span className="text-xs text-gray-500">· {selected.category}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${priorityClass(selected.priority)}`}>{selected.priority}</span>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${statusClass(selected.status)}`}>{selected.status}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-xs font-bold text-fuchsia-400 mb-2">{selected.user} (User)</div>
                  <p className="text-sm text-gray-300">
                    Hello, I have a problem: {selected.subject.toLowerCase()}. This is urgent and I need help as soon as possible. I have attached all relevant information.
                  </p>
                  <div className="text-xs text-gray-600 mt-3">{selected.date} · 09:42 AM</div>
                </div>

                {selected.messages > 1 && (
                  <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/20">
                    <div className="text-xs font-bold text-blue-400 mb-2">Support Team (Admin)</div>
                    <p className="text-sm text-gray-300">
                      Thank you for reaching out. We are currently investigating your issue and will get back to you shortly. Can you please provide your order ID?
                    </p>
                    <div className="text-xs text-gray-600 mt-3">{selected.date} · 10:15 AM</div>
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-white/5 shrink-0 space-y-3">
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Type your reply to the user..."
                  className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 resize-none"
                />
                <div className="flex gap-3">
                  <button
                    onClick={sendReply}
                    className="flex-1 flex items-center justify-center gap-2 h-10 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" /> Send Reply
                  </button>
                  <button
                    onClick={() => resolveTicket(selected.id)}
                    disabled={selected.status === 'Resolved'}
                    className="flex items-center gap-2 px-4 h-10 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 font-bold rounded-xl text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4" /> Resolve
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
              <AlertCircle className="w-16 h-16 mb-4 opacity-30" />
              <p>Select a ticket from the list to view the conversation and reply.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
