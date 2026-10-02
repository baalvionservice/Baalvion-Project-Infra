"use client";

import React, { useState } from 'react';
import { Fingerprint, Search, Filter, XCircle, User, ShieldAlert, BadgeCheck } from 'lucide-react';

const MOCK_KYC = [
  {
    id: "KYC-1049",
    username: "mumbai_dancer99",
    realName: "Priya Sharma",
    dob: "1998-05-14",
    gender: "Female",
    location: "Mumbai, India",
    idImage: "https://images.unsplash.com/photo-1579317208169-c2ec4df3e58c?w=400&h=250&fit=crop",
    selfieImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    status: "Pending Review",
    submittedDate: "2026-10-02"
  },
  {
    id: "KYC-1050",
    username: "actor_rahul",
    realName: "Rahul Verma",
    dob: "1995-11-22",
    gender: "Male",
    location: "Mumbai, India",
    idImage: "https://images.unsplash.com/photo-1621644787941-6e3e506692aa?w=400&h=250&fit=crop",
    selfieImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    status: "Under Investigation",
    submittedDate: "2026-10-01"
  }
];

type KycRequest = typeof MOCK_KYC[0];

function statusClass(status: string) {
  if (status === 'Pending Review') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  if (status === 'Under Investigation') return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
  if (status === 'Verified') return 'bg-green-500/10 text-green-400 border border-green-500/20';
  if (status === 'Rejected') return 'bg-red-500/10 text-red-400 border border-red-500/20';
  return 'bg-white/10 text-gray-400';
}

export default function IdentityKYCManager() {
  const [kycRequests, setKycRequests] = useState(MOCK_KYC);
  const [selectedUser, setSelectedUser] = useState<KycRequest | null>(null);

  const approveKYC = (id: string) => {
    setKycRequests(kycRequests.map(r => r.id === id ? { ...r, status: "Verified" } : r));
    setSelectedUser(prev => prev?.id === id ? { ...prev, status: "Verified" } : prev);
  };

  const rejectKYC = (id: string) => {
    setKycRequests(kycRequests.map(r => r.id === id ? { ...r, status: "Rejected" } : r));
    setSelectedUser(prev => prev?.id === id ? { ...prev, status: "Rejected" } : prev);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Fingerprint className="w-6 h-6 text-fuchsia-500" />
          Identity KYC Check
        </h1>
        <p className="text-sm text-gray-400 mt-1">Verify Government IDs and selfies to grant the Locals Hub Verified badge.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Queue Table */}
        <div className="lg:col-span-2 bg-[#121217] border border-white/5 rounded-xl overflow-hidden flex flex-col" style={{ height: '700px' }}>
          <div className="p-4 border-b border-white/5 flex gap-4 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search username or real name..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500/50"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-white/5 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-medium">Applicant</th>
                  <th className="px-6 py-4 font-medium">Location</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {kycRequests.map((request) => (
                  <tr
                    key={request.id}
                    className={`transition-colors cursor-pointer ${selectedUser?.id === request.id ? 'bg-white/10' : 'hover:bg-white/[0.02]'}`}
                    onClick={() => setSelectedUser(request)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-fuchsia-400">{request.username}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{request.realName}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{request.location}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${statusClass(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-sm font-bold text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-colors">
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Review Panel */}
        <div className="bg-[#121217] border border-white/5 rounded-xl flex flex-col" style={{ height: '700px' }}>
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20 shrink-0">
            <h2 className="font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-fuchsia-500" />
              Document Verification
            </h2>
          </div>

          {selectedUser ? (
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-fuchsia-500/50 shrink-0">
                  <img src={selectedUser.selfieImage} alt="Selfie" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{selectedUser.username}</div>
                  <div className="text-sm text-gray-400">ID: {selectedUser.id}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Self-Reported Data</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Legal Name", value: selectedUser.realName },
                    { label: "Date of Birth", value: selectedUser.dob },
                    { label: "Gender", value: selectedUser.gender },
                    { label: "Location", value: selectedUser.location },
                  ].map(item => (
                    <div key={item.label} className="bg-white/5 p-3 rounded-lg border border-white/10">
                      <div className="text-[10px] text-gray-500 font-bold uppercase">{item.label}</div>
                      <div className="text-sm text-gray-200 mt-1">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Submitted Government ID</h3>
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <img src={selectedUser.idImage} alt="ID Document" className="w-full object-cover" />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Verification Decision</h3>
                {selectedUser.status === 'Verified' || selectedUser.status === 'Rejected' ? (
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                    <p className="text-sm text-gray-400">This request has already been <strong className="text-white">{selectedUser.status}</strong>.</p>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => approveKYC(selectedUser.id)}
                      className="flex-1 flex items-center justify-center gap-2 h-12 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors"
                    >
                      <BadgeCheck className="w-5 h-5" /> Approve
                    </button>
                    <button
                      onClick={() => rejectKYC(selectedUser.id)}
                      className="flex-1 flex items-center justify-center gap-2 h-12 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 font-bold rounded-xl transition-colors"
                    >
                      <XCircle className="w-5 h-5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
              <User className="w-16 h-16 mb-4 opacity-50" />
              <p>Select a user from the queue to review their documents.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
