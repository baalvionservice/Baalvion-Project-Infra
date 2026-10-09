"use client";

import React, { useState, useEffect } from "react";
import { Crown, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

const ELITE_HOST_KEY = "baalvion_elite_host_applications";

interface Application {
  id: string;
  hostName?: string;
  budget: string;
  city: string;
  area: string;
  clubName?: string;
  venue?: string;
  status: string;
  dateApplied?: string;
  submittedAt?: string;
  kycStatus?: string;
  state?: string;
  isLocal?: boolean;
}

import { admin } from "@/lib/api/nightlife";

const SEED_APPLICATIONS: Application[] = [
  { id: "app-001", hostName: "Rahul Sharma", budget: "₹10,00,000", city: "Mumbai", area: "Andheri", venue: "Bastian - At The Top", status: "pending", dateApplied: "2024-10-24 14:30", kycStatus: "verified" },
  { id: "app-002", hostName: "Anonymous", budget: "₹25,00,000", city: "Pune", area: "Koregaon Park", venue: "Penthouze", status: "approved", dateApplied: "2024-10-23 09:15", kycStatus: "verified" },
];

export function EliteHostAdminClient() {
  const [activeTab, setActiveTab] = useState<"applications" | "banners">("applications");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    admin.eliteHostApplications().then(res => {
      setApplications(res.items.length > 0 ? res.items : SEED_APPLICATIONS);
      setLoading(false);
    }).catch(() => {
      setApplications(SEED_APPLICATIONS);
      setLoading(false);
    });
  }, []);

  const refresh = () => {
    setLoading(true);
    admin.eliteHostApplications().then(res => {
      setApplications(res.items.length > 0 ? res.items : SEED_APPLICATIONS);
      setLoading(false);
    }).catch(() => {
      setApplications(SEED_APPLICATIONS);
      setLoading(false);
    });
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await admin.updateEliteHostApplication(id, status);
      setApplications(prev => prev.map(app => app.id === id ? { ...app, status } : app));
    } catch {
      alert("Failed to update status.");
    }
  };

  const handleApprove = (id: string) => updateStatus(id, "approved");
  const handleReject = (id: string) => updateStatus(id, "rejected");

  const newCount = applications.filter(a => a.status === "pending").length;

  return (
    <div className="flex h-screen bg-[#050508] text-white overflow-hidden">
      <AdminSidebar />

      <main className="flex-1 ml-72 overflow-y-auto p-10">
        <div className="flex justify-between items-start mb-10 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Crown className="w-8 h-8 text-amber-500" /> Elite Hosted Parties Admin
            </h1>
            <p className="text-gray-400 mt-2">Manage host applications, active parties, and promotional banners.</p>
            {newCount > 0 && (
              <span className="inline-flex items-center gap-1.5 mt-2 text-xs bg-amber-500/20 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-full font-bold">
                📥 {newCount} new application{newCount > 1 ? "s" : ""} from public form
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/10 px-3 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <div className="flex bg-white/5 rounded-xl p-1">
              <button
                onClick={() => setActiveTab("applications")}
                className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                  activeTab === "applications" ? "bg-amber-500 text-black" : "text-gray-400 hover:text-white"
                }`}
              >
                Host Applications
              </button>
              <button
                onClick={() => setActiveTab("banners")}
                className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                  activeTab === "banners" ? "bg-amber-500 text-black" : "text-gray-400 hover:text-white"
                }`}
              >
                Promotional Banners
              </button>
            </div>
          </div>

        </div>

        {/* APPLICATIONS TAB */}
        {activeTab === "applications" && (
          <div className="animate-in fade-in duration-300">
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" placeholder="Search hosts, cities, venues..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-white" />
              </div>
              <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                <Filter className="w-4 h-4" /> Filter
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 border-b border-white/10 text-gray-400">
                  <tr>
                    <th className="p-4 font-semibold">Host / ID</th>
                    <th className="p-4 font-semibold">Location & Venue</th>
                    <th className="p-4 font-semibold">Budget</th>
                    <th className="p-4 font-semibold">KYC</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white">{app.hostName}</div>
                        <div className="text-gray-500 text-xs">{app.id}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-white font-medium">{app.venue}</div>
                        <div className="text-gray-500 text-xs">{app.area}, {app.city}</div>
                      </td>
                      <td className="p-4 font-bold text-amber-500">{app.budget}</td>
                      <td className="p-4">
                        {app.kycStatus === "verified" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-md">
                            <CheckCircle className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-md">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {app.status === "pending" && <span className="text-yellow-500 font-bold bg-yellow-500/10 px-3 py-1 rounded-full text-xs">Pending Review</span>}
                        {app.status === "approved" && <span className="text-green-500 font-bold bg-green-500/10 px-3 py-1 rounded-full text-xs">Approved & Live</span>}
                        {app.status === "rejected" && <span className="text-red-500 font-bold bg-red-500/10 px-3 py-1 rounded-full text-xs">Rejected</span>}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {app.status === "pending" && (
                          <>
                            <button onClick={() => handleApprove(app.id)} className="px-3 py-1.5 bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-black rounded-lg font-bold text-xs transition-all">
                              Approve
                            </button>
                            <button onClick={() => handleReject(app.id)} className="px-3 py-1.5 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-lg font-bold text-xs transition-all">
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BANNERS TAB */}
        {activeTab === "banners" && (
          <div className="animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Upload New Banner */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Upload className="w-5 h-5 text-amber-500" /> Upload New Banner</h3>
                <p className="text-gray-400 text-sm mb-6">Upload promotional banners for the Elite Host feature to be displayed on the Clubs dashboard or homepage. Recommended size: 1200x400px.</p>
                
                <div className="border-2 border-dashed border-white/20 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:border-amber-500/50 hover:bg-amber-500/5 transition-all cursor-pointer">
                  <ImageIcon className="w-10 h-10 text-gray-500 mb-3" />
                  <p className="text-white font-medium mb-1">Click to upload or drag and drop</p>
                  <p className="text-gray-500 text-xs">PNG, JPG or WebP (max. 5MB)</p>
                </div>
                
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Banner Title</label>
                    <input type="text" placeholder="e.g. Billionaire Night Special" className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Link/URL</label>
                    <input type="text" defaultValue="/clubs/elite-host" className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" />
                  </div>
                  <button className="w-full py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-colors">
                    Upload & Publish Banner
                  </button>
                </div>
              </div>

              {/* Active Banners */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-amber-500" /> Active Banners</h3>
                
                <div className="space-y-4">
                  <div className="border border-white/10 rounded-xl overflow-hidden bg-black">
                    <div className="h-32 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1574365561657-3f820253f545?q=80&w=2000)' }}>
                      <div className="w-full h-full bg-black/40 flex items-center justify-center">
                        <span className="text-white font-bold tracking-widest uppercase">Hero Banner 1</span>
                      </div>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                      <div>
                        <div className="text-sm font-bold text-white">Default Elite Host Banner</div>
                        <div className="text-xs text-gray-500">Links to: /clubs/elite-host</div>
                      </div>
                      <button className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors">Remove</button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
