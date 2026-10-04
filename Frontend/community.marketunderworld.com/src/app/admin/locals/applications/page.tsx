"use client"

import { useCallback, useEffect, useState } from "react";
import { 
  MessageSquare, User, Phone, Mail, Instagram, CheckCircle2, 
  XCircle, Eye, MapPin, Calendar, Search, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { admin, type ApplicationStatus, type ListingApplication } from "@/lib/api/nightlife";

type AppStatus = ApplicationStatus;

const STATUS_CONFIG = {
  pending: { label: "Pending Review", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  shortlisted: { label: "Shortlisted", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  accepted: { label: "Accepted", color: "text-green-400 bg-green-500/10 border-green-500/20" },
  rejected: { label: "Rejected", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  withdrawn: { label: "Withdrawn", color: "text-gray-400 bg-gray-500/10 border-gray-500/20" },
};

export default function AdminLocalsApplicationsPage() {
  const [applications, setApplications] = useState<ListingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError("");
      setApplications((await admin.applications()).items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = applications.filter((a) => {
    const matchFilter = statusFilter === "all" || a.status === statusFilter;
    const matchSearch = a.fullName.toLowerCase().includes(search.toLowerCase()) ||
                        (a.listing?.title ?? "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const updateStatus = async (id: string, status: Exclude<AppStatus, "withdrawn">) => {
    try {
      setError("");
      await admin.setApplicationStatus(id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update application");
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-bold uppercase tracking-widest mb-2">
          <MessageSquare className="w-4 h-4" /> Locals Hub Admin
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">Applications Inbox</h1>
        <p className="text-gray-500 text-sm mt-1">All incoming applications with contact details, links, and notes.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Applications", value: applications.length, color: "text-white" },
          { label: "Pending", value: applications.filter(a => a.status === "pending").length, color: "text-amber-400" },
          { label: "Accepted", value: applications.filter(a => a.status === "accepted").length, color: "text-green-400" },
          { label: "Rejected", value: applications.filter(a => a.status === "rejected").length, color: "text-red-400" },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{stat.label}</div>
            <div className={`text-4xl font-black ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search applicants or listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 outline-none focus:border-fuchsia-500/50 transition-colors text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "pending", "shortlisted", "accepted", "rejected"] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "px-4 h-12 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all capitalize",
                statusFilter === f ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-transparent text-gray-500 hover:text-gray-300"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Applications */}
      <div className="flex flex-col gap-4">
        {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
        {loading && <div className="py-16 text-center text-gray-500">Loading…</div>}
        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center text-gray-500">No applications found.</div>
        )}
        {filtered.map((app) => {
          const cfg = STATUS_CONFIG[app.status];
          const d = app.details ?? {};
          const isExpanded = expandedId === app.id;
          return (
            <div key={app.id} className="rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden">
              {/* Row Header */}
              <div className="p-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-lg font-black text-fuchsia-400">
                    {app.fullName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-lg">{app.fullName}</span>
                      <span className="text-sm text-gray-400">{d.age ? ` · Age ${d.age}` : ""}{d.gender ? ` · ${d.gender}` : ""}</span>
                      <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full border uppercase tracking-wider", cfg.color)}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5 line-clamp-1">{app.listing?.title ?? "Listing"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : app.id)}
                    className="flex items-center gap-2 h-10 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-colors border border-white/10"
                  >
                    <Eye className="w-4 h-4" /> {isExpanded ? "Collapse" : "View Full"}
                  </button>
                  {app.status === "pending" && (
                    <button
                      onClick={() => updateStatus(app.id, "shortlisted")}
                      className="h-10 px-4 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold transition-colors border border-blue-500/20"
                    >
                      Shortlist
                    </button>
                  )}
                  {app.status !== "accepted" && app.status !== "withdrawn" && (
                    <button
                      onClick={() => updateStatus(app.id, "accepted")}
                      className="h-10 px-4 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-bold transition-colors border border-green-500/20 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Accept
                    </button>
                  )}
                  {app.status !== "rejected" && app.status !== "withdrawn" && (
                    <button
                      onClick={() => updateStatus(app.id, "rejected")}
                      className="h-10 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-colors border border-red-500/20 flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-6 pb-6 border-t border-white/5 pt-6 space-y-6">
                  {/* Quick Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { icon: Phone, label: "WhatsApp", value: app.phone },
                      { icon: Mail, label: "Email", value: app.email },
                      { icon: MapPin, label: "City", value: [d.city, d.state, d.country].filter(Boolean).join(", ") },
                      { icon: User, label: "Height", value: d.height },
                    ].map(item => (
                      <div key={item.label} className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                          <item.icon className="w-3.5 h-3.5" /> {item.label}
                        </div>
                        <div className="text-sm font-medium text-white">{item.value || "—"}</div>
                      </div>
                    ))}
                  </div>

                  {/* Instagram + Video */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <Instagram className="w-3.5 h-3.5" /> Instagram
                      </div>
                      <div className="text-sm font-medium text-fuchsia-400">{d.instagram || "—"}</div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Intro Video</div>
                      {d.introVideoLink ? (
                        <a href={d.introVideoLink} target="_blank" rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-400 underline truncate block">
                          {d.introVideoLink}
                        </a>
                      ) : (
                        <div className="text-sm text-gray-500">Not provided</div>
                      )}
                    </div>
                  </div>

                  {/* Photos + Message */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Personal Message</div>
                      <p className="text-sm text-gray-300 leading-relaxed">{app.message || "—"}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Submitted: {new Date(app.createdAt).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
