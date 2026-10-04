"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Archive, ArchiveRestore, Edit } from "lucide-react";
import { INDIAN_NIGHTLIFE_STATES } from "@/data/clubs-data";
import { admin, type ApiClub, type ClubInput } from "@/lib/api/nightlife";
import type { VipPackage } from "@/data/clubs-data";
import { ImageUpload } from "@/components/upload/image-upload";

const emptyForm: Partial<ApiClub> = {
  name: "",
  state: INDIAN_NIGHTLIFE_STATES[0],
  city: "",
  image: "",
  musicType: [],
  daysOpen: "",
  description: "",
  coverCharge: "",
  contactEmail: "",
  vipPackages: [],
};

// Optional text fields are omitted when blank so the API's URL/length validation only sees real input.
const blank = (v?: string | null) => (v && v.trim() ? v.trim() : undefined);

export default function AdminClubsPage() {
  const [clubs, setClubs] = useState<ApiClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Partial<ApiClub>>(emptyForm);
  const [musicInput, setMusicInput] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      setClubs((await admin.clubs()).items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load clubs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredClubs = clubs.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase()) ||
    c.state.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddMusic = () => {
    const value = musicInput.trim();
    if (value && form.musicType) {
      setForm({ ...form, musicType: [...form.musicType, value] });
      setMusicInput("");
    }
  };

  const removeMusic = (index: number) => {
    if (form.musicType) {
      setForm({ ...form, musicType: form.musicType.filter((_, i) => i !== index) });
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.state || !form.city) {
      setError("Name, State and City are required.");
      return;
    }
    const payload: ClubInput = {
      name: form.name,
      state: form.state,
      city: form.city,
      image: blank(form.image),
      musicTypes: form.musicType ?? [],
      daysOpen: blank(form.daysOpen),
      coverCharge: blank(form.coverCharge),
      description: blank(form.description),
      contactEmail: blank(form.contactEmail),
      vipPackages: (form.vipPackages ?? []).filter((p) => p.name.trim() && p.minimumSpend.trim()),
    };
    setSaving(true);
    try {
      setError("");
      if (form.id) await admin.updateClub(form.id, payload);
      else await admin.createClub(payload);
      setShowModal(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save club");
    } finally {
      setSaving(false);
    }
  };

  const updatePackage = (i: number, patch: Partial<VipPackage>) =>
    setForm({ ...form, vipPackages: (form.vipPackages ?? []).map((p, idx) => (idx === i ? { ...p, ...patch } : p)) });

  const handleEdit = (club: ApiClub) => {
    setForm({ ...club });
    setShowModal(true);
  };

  // Pre-launch the console archives instead of deleting, so bookings keep resolving to their club.
  const toggleArchive = async (club: ApiClub) => {
    const archiving = club.status === "active";
    if (archiving && !confirm(`Archive "${club.name}"? It will disappear from the public directory.`)) return;
    try {
      setError("");
      await admin.updateClub(club.id, { status: archiving ? "archived" : "active" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update club");
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Pubs & Nightclubs Directory</h1>
          <p className="text-gray-500 mt-2">Manage your global nightlife listings and directories.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add New Pub
        </button>
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex gap-4 mb-6 relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search by pub name, state or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 pr-4 py-3 w-full border border-gray-200 rounded-lg outline-none focus:border-fuchsia-500 transition-colors"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-4 font-semibold text-gray-500">Name</th>
                <th className="pb-4 font-semibold text-gray-500">Location</th>
                <th className="pb-4 font-semibold text-gray-500">Days Open</th>
                <th className="pb-4 font-semibold text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && <tr><td colSpan={4} className="py-8 text-center text-gray-400">Loading…</td></tr>}
              {!loading && filteredClubs.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-gray-400">No clubs found.</td></tr>}
              {filteredClubs.map(club => (
                <tr key={club.id} className="hover:bg-gray-50/50">
                  <td className="py-4 font-medium flex items-center gap-3">
                    {club.image ? (
                       <img src={club.image} alt={club.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                       <div className="w-10 h-10 bg-gray-100 rounded-lg" />
                    )}
                    {club.name}
                    {club.status === "archived" && <span className="text-xs font-semibold text-gray-500 bg-gray-100 rounded px-2 py-0.5">Archived</span>}
                  </td>
                  <td className="py-4 text-gray-600">
                    <span className="font-medium text-gray-800">{club.city}</span>, {club.state}
                  </td>
                  <td className="py-4 text-gray-600">{club.daysOpen ?? "—"}</td>
                  <td className="py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(club)} className="p-2 text-gray-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggleArchive(club)} title={club.status === "active" ? "Archive" : "Restore"} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        {club.status === "active" ? <Archive className="w-4 h-4" /> : <ArchiveRestore className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-6">{form.id ? "Edit Pub" : "Add New Pub"}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pub Name *</label>
                <input 
                  type="text" 
                  value={form.name ?? ""} 
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full border p-2.5 rounded-lg outline-none focus:border-fuchsia-500" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <select 
                    value={form.state} 
                    onChange={e => setForm({...form, state: e.target.value})}
                    className="w-full border p-2.5 rounded-lg outline-none focus:border-fuchsia-500 bg-white"
                  >
                    <option value="">Select State</option>
                    {INDIAN_NIGHTLIFE_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input 
                    type="text" 
                    value={form.city ?? ""} 
                    onChange={e => setForm({...form, city: e.target.value})}
                    className="w-full border p-2.5 rounded-lg outline-none focus:border-fuchsia-500" 
                  />
                </div>
              </div>

              <ImageUpload tone="light" allowLink label="Club photo" purpose="club_image" value={form.image ?? ""} onChange={(url) => setForm({ ...form, image: url })} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Music Types</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    value={musicInput}
                    onChange={e => setMusicInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddMusic()}
                    placeholder="e.g. Techno, Bollywood"
                    className="flex-1 border p-2.5 rounded-lg outline-none focus:border-fuchsia-500" 
                  />
                  <button onClick={handleAddMusic} className="px-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.musicType?.map((m, i) => (
                    <span key={i} className="bg-fuchsia-100 text-fuchsia-700 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                      {m}
                      <button onClick={() => removeMusic(i)} className="hover:text-red-500">&times;</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days Open</label>
                  <input 
                    type="text" 
                    value={form.daysOpen ?? ""} 
                    onChange={e => setForm({...form, daysOpen: e.target.value})}
                    placeholder="e.g. Wed - Sun"
                    className="w-full border p-2.5 rounded-lg outline-none focus:border-fuchsia-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cover Charge</label>
                  <input 
                    type="text" 
                    value={form.coverCharge ?? ""} 
                    onChange={e => setForm({...form, coverCharge: e.target.value})}
                    placeholder="e.g. ₹3,000"
                    className="w-full border p-2.5 rounded-lg outline-none focus:border-fuchsia-500" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue contact email</label>
                <input type="email" value={form.contactEmail ?? ""} onChange={e => setForm({...form, contactEmail: e.target.value})} placeholder="reservations@venue.com" className="w-full border p-2.5 rounded-lg outline-none focus:border-fuchsia-500" />
                <p className="text-xs text-gray-500 mt-1">New guest-list and VIP requests are emailed here with the guest&apos;s name, phone and email. Never shown publicly.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">VIP table packages</label>
                  <button type="button" onClick={() => setForm({ ...form, vipPackages: [...(form.vipPackages ?? []), { name: "", minimumSpend: "", perks: [], popular: false }] })} className="text-sm text-fuchsia-600 font-medium">+ Add package</button>
                </div>
                <p className="text-xs text-gray-500 mb-2">Only enter prices the venue has confirmed. With none, the page shows a plain table-request form.</p>
                {(form.vipPackages ?? []).map((p, i) => (
                  <div key={i} className="border rounded-lg p-3 mb-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input className="border p-2 rounded text-sm" placeholder="Name (e.g. VIP Booth)" value={p.name} onChange={(e) => updatePackage(i, { name: e.target.value })} />
                      <input className="border p-2 rounded text-sm" placeholder="Minimum spend (e.g. ₹60,000)" value={p.minimumSpend} onChange={(e) => updatePackage(i, { minimumSpend: e.target.value })} />
                      <input className="border p-2 rounded text-sm" placeholder="Capacity (optional)" value={p.capacity ?? ""} onChange={(e) => updatePackage(i, { capacity: e.target.value })} />
                      <input className="border p-2 rounded text-sm" placeholder="Bottles (optional)" value={p.bottles ?? ""} onChange={(e) => updatePackage(i, { bottles: e.target.value })} />
                    </div>
                    <input className="w-full border p-2 rounded text-sm" placeholder="Perks, comma separated" value={p.perks.join(", ")} onChange={(e) => updatePackage(i, { perks: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center gap-2"><input type="checkbox" checked={p.popular} onChange={(e) => updatePackage(i, { popular: e.target.checked })} /> Mark as most popular</label>
                      <button type="button" onClick={() => setForm({ ...form, vipPackages: (form.vipPackages ?? []).filter((_, idx) => idx !== i) })} className="text-red-600">Remove</button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  value={form.description ?? ""} 
                  onChange={e => setForm({...form, description: e.target.value})}
                  rows={3}
                  className="w-full border p-2.5 rounded-lg outline-none focus:border-fuchsia-500 resize-none" 
                />
              </div>

            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 rounded-lg border border-gray-200 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-lg bg-fuchsia-600 text-white font-medium hover:bg-fuchsia-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Pub"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
