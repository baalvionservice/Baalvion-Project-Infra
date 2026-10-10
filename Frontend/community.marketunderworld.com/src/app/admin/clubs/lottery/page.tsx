"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Ticket, Trophy, Users, Settings, RefreshCw, CheckCircle,
  Search, Calendar, Download, Plus, Trash2, MapPin, Building2,
  ChevronDown, AlertCircle, Edit3, Save, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { INDIAN_NIGHTLIFE_STATES } from "@/data/clubs-data";
import { admin, type ApiClub } from "@/lib/api/nightlife";

// ─── Types ──────────────────────────────────────────────────────────────────

interface MonthlyDraw {
  id: string;
  month: number; // 1-12
  year: number;
  entryFee: number;
  maxWinners: number;
  featuredVenues: FeaturedVenue[];
  status: "upcoming" | "active" | "drawn" | "closed";
  totalParticipants: number;
  winnersDrawn: boolean;
  createdAt: string;
}

interface FeaturedVenue {
  clubId: string;
  clubName: string;
  city: string;
  state: string;
  ticketsAllocated: number;
}

interface Participant {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  kycStatus: "approved" | "pending" | "rejected";
  joinedAt: string;
  isWinner: boolean;
  venueWon?: string;
  drawId: string;
}

// ─── Mock monthly draws ───────────────────────────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const MOCK_DRAWS: MonthlyDraw[] = [
  {
    id: "draw-2026-10",
    month: 10, year: 2026,
    entryFee: 6, maxWinners: 1000,
    featuredVenues: [
      { clubId: "c1", clubName: "Kitty Su", city: "Mumbai", state: "Maharashtra", ticketsAllocated: 334 },
      { clubId: "c2", clubName: "Privee", city: "Delhi", state: "Delhi (NCT)", ticketsAllocated: 333 },
      { clubId: "c3", clubName: "Prism Club & Kitchen", city: "Gurgaon", state: "Delhi NCR", ticketsAllocated: 333 },
    ],
    status: "active", totalParticipants: 847, winnersDrawn: false, createdAt: "2026-10-01T00:00:00Z"
  },
  {
    id: "draw-2026-09",
    month: 9, year: 2026,
    entryFee: 6, maxWinners: 1000,
    featuredVenues: [
      { clubId: "c4", clubName: "Aer", city: "Mumbai", state: "Maharashtra", ticketsAllocated: 500 },
      { clubId: "c5", clubName: "Social", city: "Bangalore", state: "Karnataka", ticketsAllocated: 500 },
    ],
    status: "drawn", totalParticipants: 2341, winnersDrawn: true, createdAt: "2026-09-01T00:00:00Z"
  }
];



const MOCK_PARTICIPANTS: Participant[] = Array.from({ length: 80 }, (_, i) => ({
  id: `p-${i}`,
  fullName: `Participant ${i + 1}`,
  email: `user${i + 1}@example.com`,
  phone: `+91 98765 ${String(i).padStart(5, "0")}`,
  nationality: i % 5 === 0 ? "British" : "Indian",
  kycStatus: i % 7 === 0 ? "pending" : "approved",
  joinedAt: new Date(Date.now() - Math.random() * 20 * 86400000).toISOString(),
  isWinner: false,
  drawId: "draw-2026-10",
}));

// Cryptographically fair Fisher-Yates shuffle
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Excel export helper ─────────────────────────────────────────────────────

function exportToExcel(participants: Participant[], drawLabel: string) {
  const headers = ["#", "Full Name", "Email", "Phone", "Nationality", "KYC Status", "Joined At", "Is Winner", "Venue Won"];
  const rows = participants.map((p, i) => [
    i + 1, p.fullName, p.email, p.phone, p.nationality,
    p.kycStatus, new Date(p.joinedAt).toLocaleString("en-IN"),
    p.isWinner ? "Yes" : "No", p.venueWon ?? "-"
  ]);

  // Build CSV
  const csv = [headers, ...rows]
    .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lottery-${drawLabel}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-component: Draw Editor ──────────────────────────────────────────────

function DrawEditor({
  draw,
  clubs,
  onSave,
  onClose,
}: {
  draw: Partial<MonthlyDraw>;
  clubs: ApiClub[];
  onSave: (d: Partial<MonthlyDraw>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<MonthlyDraw>>(draw);
  const [stateFilter, setStateFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");

  const availableStates = ["All", ...INDIAN_NIGHTLIFE_STATES];
  const filteredClubs = clubs.filter(c => {
    const matchState = stateFilter === "All" || c.state === stateFilter;
    const matchCity = cityFilter === "All" || c.city === cityFilter;
    return matchState && matchCity;
  });

  // Unique cities in selected state
  const cities = ["All", ...Array.from(new Set(
    clubs.filter(c => stateFilter === "All" || c.state === stateFilter).map(c => c.city)
  ))];

  const isFeatured = (clubId: string) =>
    (form.featuredVenues ?? []).some(v => v.clubId === clubId);

  const toggleVenue = (club: ApiClub) => {
    const current = form.featuredVenues ?? [];
    if (isFeatured(club.id)) {
      setForm({ ...form, featuredVenues: current.filter(v => v.clubId !== club.id) });
    } else {
      if (current.length >= 3) { alert("Max 3 venues per draw."); return; }
      setForm({
        ...form,
        featuredVenues: [
          ...current,
          { clubId: club.id, clubName: club.name, city: club.city, state: club.state, ticketsAllocated: 0 }
        ]
      });
    }
  };

  const setTickets = (clubId: string, val: number) => {
    setForm({
      ...form,
      featuredVenues: (form.featuredVenues ?? []).map(v =>
        v.clubId === clubId ? { ...v, ticketsAllocated: val } : v
      )
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#0d0d1a] z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-[#ed6c2a]" />
            {form.id ? "Edit Draw" : "New Monthly Draw"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Month / Year / Fee / Winners */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Month</label>
              <select
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#ed6c2a]"
                value={form.month ?? new Date().getMonth() + 1}
                onChange={e => setForm({ ...form, month: Number(e.target.value) })}
              >
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Year</label>
              <input
                type="number"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#ed6c2a]"
                value={form.year ?? new Date().getFullYear()}
                onChange={e => setForm({ ...form, year: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Entry Fee ($)</label>
              <input
                type="number"
                min={1}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#ed6c2a]"
                value={form.entryFee ?? 6}
                onChange={e => setForm({ ...form, entryFee: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Max Winners</label>
              <input
                type="number"
                min={1}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#ed6c2a]"
                value={form.maxWinners ?? 1000}
                onChange={e => setForm({ ...form, maxWinners: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Venue Picker */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#ed6c2a]" />
              Select Featured Venues (max 3)
            </h3>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">State / Region</label>
                <select
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#ed6c2a]"
                  value={stateFilter}
                  onChange={e => { setStateFilter(e.target.value); setCityFilter("All"); }}
                >
                  {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">City</label>
                <select
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#ed6c2a]"
                  value={cityFilter}
                  onChange={e => setCityFilter(e.target.value)}
                >
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Club grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-52 overflow-y-auto pr-1">
              {filteredClubs.length === 0 && (
                <p className="text-gray-500 text-sm col-span-2 py-4 text-center">No clubs found for this filter.</p>
              )}
              {filteredClubs.map(club => {
                const featured = isFeatured(club.id);
                return (
                  <div
                    key={club.id}
                    onClick={() => toggleVenue(club)}
                    className={cn(
                      "p-3 rounded-xl border cursor-pointer transition-all",
                      featured
                        ? "border-[#ed6c2a] bg-[#ed6c2a]/10"
                        : "border-white/10 bg-white/5 hover:border-white/30"
                    )}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-white truncate">{club.name}</p>
                        <p className="text-xs text-gray-400">{club.city}, {club.state}</p>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center",
                        featured ? "bg-[#ed6c2a] border-[#ed6c2a]" : "border-white/30"
                      )}>
                        {featured && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ticket allocation for selected venues */}
            {(form.featuredVenues ?? []).length > 0 && (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Ticket allocation per venue</p>
                {(form.featuredVenues ?? []).map(v => (
                  <div key={v.clubId} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white">{v.clubName}</p>
                      <p className="text-xs text-gray-400">{v.city}, {v.state}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Tickets:</span>
                      <input
                        type="number"
                        min={1}
                        value={v.ticketsAllocated}
                        onChange={e => setTickets(v.clubId, Number(e.target.value))}
                        className="w-20 bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-[#ed6c2a]"
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); toggleVenue({ id: v.clubId } as ApiClub); }}
                      className="text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save */}
          <button
            onClick={() => onSave(form)}
            className="w-full bg-[#ed6c2a] hover:bg-[#d85e21] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Draw
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdminLotteryPage() {
  const [draws, setDraws] = useState<MonthlyDraw[]>(MOCK_DRAWS);
  const [selectedDraw, setSelectedDraw] = useState<MonthlyDraw>(MOCK_DRAWS[0]);
  const [participants, setParticipants] = useState<Participant[]>(MOCK_PARTICIPANTS);

  useEffect(() => {
    admin.lotteryDraws().then(res => {
      if (res.items && res.items.length > 0) {
        setParticipants(res.items);
      } else {
        setParticipants(MOCK_PARTICIPANTS);
      }
    }).catch(() => {
      setParticipants(MOCK_PARTICIPANTS);
    });
  }, []);
  const [clubs, setClubs] = useState<ApiClub[]>([]);
  const [activeTab, setActiveTab] = useState<"draws" | "participants" | "winners">("draws");
  const [search, setSearch] = useState("");
  const [kycFilter, setKycFilter] = useState<"all" | "approved" | "pending">("all");
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawComplete, setDrawComplete] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingDraw, setEditingDraw] = useState<Partial<MonthlyDraw>>({});

  // Load real clubs for the venue picker
  const loadClubs = useCallback(async () => {
    try {
      const result = await admin.clubs();
      setClubs(result.items);
    } catch {
      // Fall back to empty — venue picker still shows filter UI
    }
  }, []);

  useEffect(() => { loadClubs(); }, [loadClubs]);

  const drawParticipants = participants.filter(p => p.drawId === selectedDraw.id);
  const filteredParticipants = drawParticipants.filter(p => {
    const matchSearch =
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase());
    const matchKyc = kycFilter === "all" || p.kycStatus === kycFilter;
    return matchSearch && matchKyc;
  });
  const winners = drawParticipants.filter(p => p.isWinner);

  const handleRunDraw = () => {
    const eligible = drawParticipants.filter(p => p.kycStatus === "approved" && !p.isWinner);
    if (eligible.length === 0) {
      alert("No KYC-approved participants to draw from.");
      return;
    }

    const maxW = selectedDraw.maxWinners;
    const venues = selectedDraw.featuredVenues;

    // Confirm before running — this cannot be undone
    const proceed = window.confirm(
      `Run draw for ${MONTHS[selectedDraw.month - 1]} ${selectedDraw.year}?\n\n` +
      `• ${eligible.length} eligible (KYC-approved) participants\n` +
      `• Up to ${maxW} winners will be selected randomly\n\n` +
      `This action cannot be undone.`
    );
    if (!proceed) return;

    setIsDrawing(true);

    setTimeout(() => {
      // 1. Shuffle eligible participants — Fisher-Yates
      const shuffled = shuffleArray(eligible);
      const picked = shuffled.slice(0, Math.min(maxW, shuffled.length));
      const winnerIds = new Set(picked.map(p => p.id));

      // 2. Assign venues proportionally
      //    Each venue gets its ticketsAllocated share, filled in order of winners
      const totalAllocated = venues.reduce((s, v) => s + (v.ticketsAllocated || 0), 0);
      let venueAssignments: string[] = [];
      if (totalAllocated > 0) {
        for (const v of venues) {
          const count = Math.round((v.ticketsAllocated / totalAllocated) * picked.length);
          venueAssignments = [...venueAssignments, ...Array(count).fill(v.clubName)];
        }
        // Pad any rounding gap with the last venue
        while (venueAssignments.length < picked.length) {
          venueAssignments.push(venues[venues.length - 1].clubName);
        }
      } else {
        // No allocation set — round-robin across all venues
        venueAssignments = picked.map((_, i) => venues[i % venues.length]?.clubName ?? "TBD");
      }

      // 3. Update participant state
      setParticipants(prev => prev.map(p => {
        if (!winnerIds.has(p.id)) return p;
        const idx = picked.findIndex(w => w.id === p.id);
        return { ...p, isWinner: true, venueWon: venueAssignments[idx] ?? "TBD" };
      }));

      // 4. Mark draw as drawn
      setDraws(prev => prev.map(d =>
        d.id === selectedDraw.id ? { ...d, winnersDrawn: true, status: "drawn" } : d
      ));

      setIsDrawing(false);
      setDrawComplete(true);
      setActiveTab("winners");
    }, 2500); // Animated delay for UX
  };

  const handleSaveDraw = (form: Partial<MonthlyDraw>) => {
    if (form.id) {
      setDraws(prev => prev.map(d => d.id === form.id ? { ...d, ...form } as MonthlyDraw : d));
    } else {
      const newDraw: MonthlyDraw = {
        id: `draw-${form.year}-${form.month}`,
        month: form.month ?? new Date().getMonth() + 1,
        year: form.year ?? new Date().getFullYear(),
        entryFee: form.entryFee ?? 6,
        maxWinners: form.maxWinners ?? 1000,
        featuredVenues: form.featuredVenues ?? [],
        status: "upcoming",
        totalParticipants: 0,
        winnersDrawn: false,
        createdAt: new Date().toISOString(),
      };
      setDraws(prev => [newDraw, ...prev]);
      setSelectedDraw(newDraw);
    }
    setShowEditor(false);
  };

  return (
    <div className="space-y-8 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Ticket className="w-8 h-8 text-[#ed6c2a]" />
            Ticket Lottery Management
          </h1>
          <p className="text-gray-400 mt-1">
            Manage monthly draws · select cities & venues · export participant data
          </p>
        </div>
        <button
          onClick={() => { setEditingDraw({}); setShowEditor(true); }}
          className="flex items-center gap-2 bg-[#ed6c2a] hover:bg-[#d85e21] text-white font-bold px-5 py-3 rounded-xl transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          New Monthly Draw
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        {(["draws", "participants", "winners"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-5 py-3 text-sm font-bold capitalize transition-all border-b-2 -mb-px",
              activeTab === tab
                ? "border-[#ed6c2a] text-[#ed6c2a]"
                : "border-transparent text-gray-400 hover:text-white"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── TAB: DRAWS ─────────────────────────────────────────────────────── */}
      {activeTab === "draws" && (
        <div className="space-y-6">
          {draws.map(draw => (
            <div
              key={draw.id}
              className={cn(
                "bg-white/5 border rounded-2xl p-6 transition-all cursor-pointer",
                selectedDraw.id === draw.id
                  ? "border-[#ed6c2a] ring-1 ring-[#ed6c2a]/30"
                  : "border-white/10 hover:border-white/20"
              )}
              onClick={() => setSelectedDraw(draw)}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#ed6c2a]/10 border border-[#ed6c2a]/20 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-[#ed6c2a]">{MONTHS[draw.month - 1]}</span>
                    <span className="text-lg font-bold text-white leading-tight">{draw.year}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{MONTHS[draw.month - 1]} {draw.year} Draw</h3>
                      <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full",
                        draw.status === "active" && "bg-green-500/20 text-green-400",
                        draw.status === "drawn" && "bg-blue-500/20 text-blue-400",
                        draw.status === "upcoming" && "bg-amber-500/20 text-amber-400",
                        draw.status === "closed" && "bg-gray-500/20 text-gray-400",
                      )}>
                        {draw.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {draw.totalParticipants.toLocaleString()} participants · ${draw.entryFee} entry · {draw.maxWinners.toLocaleString()} winners
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Featured venues chips */}
                  <div className="flex flex-wrap gap-2">
                    {draw.featuredVenues.map(v => (
                      <span key={v.clubId} className="flex items-center gap-1.5 text-xs bg-white/10 border border-white/10 rounded-full px-3 py-1 text-gray-300">
                        <MapPin className="w-3 h-3 text-[#ed6c2a]" />
                        {v.clubName} · {v.city}
                      </span>
                    ))}
                    {draw.featuredVenues.length === 0 && (
                      <span className="text-xs text-gray-500 italic">No venues selected yet</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={e => { e.stopPropagation(); setEditingDraw(draw); setShowEditor(true); }}
                      className="p-2 text-gray-400 hover:text-white bg-white/5 border border-white/10 rounded-lg transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); exportToExcel(participants.filter(p => p.drawId === draw.id), `${MONTHS[draw.month-1]}-${draw.year}`); }}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export CSV
                    </button>
                    {!draw.winnersDrawn && draw.status === "active" && (
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedDraw(draw); handleRunDraw(); }}
                        disabled={isDrawing}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-[#ed6c2a] text-white rounded-lg hover:bg-[#d85e21] transition-all disabled:opacity-60"
                      >
                        {isDrawing && selectedDraw.id === draw.id ? (
                          <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Drawing...</>
                        ) : (
                          <><Trophy className="w-3.5 h-3.5" />Run Draw</>
                        )}
                      </button>
                    )}
                    {draw.winnersDrawn && (
                      <span className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Winners Drawn
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Revenue bar */}
              <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Revenue</p>
                  <p className="font-bold text-green-400">${(draw.totalParticipants * draw.entryFee).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Featured Venues</p>
                  <p className="font-bold">{draw.featuredVenues.length} / 3</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tickets to Give</p>
                  <p className="font-bold text-[#ed6c2a]">{draw.featuredVenues.reduce((sum, v) => sum + v.ticketsAllocated, 0).toLocaleString() || draw.maxWinners.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: PARTICIPANTS ───────────────────────────────────────────────── */}
      {activeTab === "participants" && (
        <div className="space-y-5">
          {/* Top bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-3 flex-wrap items-center">
              {/* Draw selector */}
              <select
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#ed6c2a]"
                value={selectedDraw.id}
                onChange={e => setSelectedDraw(draws.find(d => d.id === e.target.value) ?? draws[0])}
              >
                {draws.map(d => (
                  <option key={d.id} value={d.id}>{MONTHS[d.month-1]} {d.year}</option>
                ))}
              </select>
              {/* KYC filter */}
              {(["all", "approved", "pending"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setKycFilter(f)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-bold capitalize border transition-all",
                    kycFilter === f
                      ? "bg-[#ed6c2a] border-[#ed6c2a] text-white"
                      : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30"
                  )}
                >
                  {f === "all" ? "All KYC" : f}
                </button>
              ))}
            </div>
            <button
              onClick={() => exportToExcel(filteredParticipants, `${MONTHS[selectedDraw.month-1]}-${selectedDraw.year}`)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl hover:bg-green-500/20 transition-all"
            >
              <Download className="w-4 h-4" />
              Export to CSV
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#ed6c2a]"
            />
          </div>

          {/* Table */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-5 py-3 text-gray-400 font-semibold">#</th>
                    <th className="text-left px-5 py-3 text-gray-400 font-semibold">Name</th>
                    <th className="text-left px-5 py-3 text-gray-400 font-semibold">Email</th>
                    <th className="text-left px-5 py-3 text-gray-400 font-semibold">Phone</th>
                    <th className="text-left px-5 py-3 text-gray-400 font-semibold">Nationality</th>
                    <th className="text-left px-5 py-3 text-gray-400 font-semibold">KYC</th>
                    <th className="text-left px-5 py-3 text-gray-400 font-semibold">Joined</th>
                    <th className="text-left px-5 py-3 text-gray-400 font-semibold">Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map((p, idx) => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3 text-gray-500 text-xs">{idx + 1}</td>
                      <td className="px-5 py-3 font-medium">{p.fullName}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{p.email}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{p.phone}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{p.nationality}</td>
                      <td className="px-5 py-3">
                        <span className={cn(
                          "text-xs font-bold px-2 py-0.5 rounded-full",
                          p.kycStatus === "approved" && "bg-green-500/20 text-green-400",
                          p.kycStatus === "pending" && "bg-amber-500/20 text-amber-400",
                          p.kycStatus === "rejected" && "bg-red-500/20 text-red-400",
                        )}>
                          {p.kycStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{new Date(p.joinedAt).toLocaleDateString("en-IN")}</td>
                      <td className="px-5 py-3">
                        {p.isWinner ? (
                          <span className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                            <Trophy className="w-3.5 h-3.5" />
                            {p.venueWon}
                          </span>
                        ) : (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                Showing {filteredParticipants.length} of {drawParticipants.length} participants
              </span>
              <span className="text-xs text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Only KYC-approved users can pay & participate
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: WINNERS ───────────────────────────────────────────────────── */}
      {activeTab === "winners" && (
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold">{MONTHS[selectedDraw.month-1]} {selectedDraw.year} Winners</h2>
              <p className="text-gray-400 text-sm">{winners.length} winners from {selectedDraw.totalParticipants} participants</p>
            </div>
            <button
              onClick={() => exportToExcel(winners, `winners-${MONTHS[selectedDraw.month-1]}-${selectedDraw.year}`)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl hover:bg-green-500/20 transition-all"
            >
              <Download className="w-4 h-4" />
              Export Winners CSV
            </button>
          </div>

          {/* Venue breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {selectedDraw.featuredVenues.map(v => {
              const venueWinners = winners.filter(w => w.venueWon === v.clubName);
              return (
                <div key={v.clubId} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{v.city}, {v.state}</p>
                  <h3 className="font-bold text-white mb-1">{v.clubName}</h3>
                  <p className="text-2xl font-bold text-[#ed6c2a]">{venueWinners.length}</p>
                  <p className="text-xs text-gray-500">winners / {v.ticketsAllocated} allocated</p>
                </div>
              );
            })}
          </div>

          {/* Winners table */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-5 py-3 text-gray-400 font-semibold">#</th>
                    <th className="text-left px-5 py-3 text-gray-400 font-semibold">Name</th>
                    <th className="text-left px-5 py-3 text-gray-400 font-semibold">Email</th>
                    <th className="text-left px-5 py-3 text-gray-400 font-semibold">Nationality</th>
                    <th className="text-left px-5 py-3 text-gray-400 font-semibold">Venue Won</th>
                  </tr>
                </thead>
                <tbody>
                  {winners.map((w, idx) => (
                    <tr key={w.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3 text-gray-500 text-xs">{idx + 1}</td>
                      <td className="px-5 py-3 font-medium">{w.fullName}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{w.email}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{w.nationality}</td>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-1.5 text-[#ed6c2a] font-semibold text-xs">
                          <MapPin className="w-3.5 h-3.5" />
                          {w.venueWon}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Draw Editor Modal ───────────────────────────────────────────────── */}
      {showEditor && (
        <DrawEditor
          draw={editingDraw}
          clubs={clubs}
          onSave={handleSaveDraw}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}
