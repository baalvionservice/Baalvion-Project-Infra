"use client"

import { useState } from "react";
import { admin } from "@/lib/api/nightlife";
import {
  Megaphone, Send, CheckCircle2, AlertCircle, ChevronDown, ArrowLeft,
  Plus, Trash2, Users, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ROLE_CATEGORIES, CATEGORY_EMOJI, getRolesByCategory,
  RoleCategory, RoleRequirement, RoleDefinition,
} from "@/data/locals-roles";

type ListingType = "Casting & Jobs" | "Events" | "Matchmaking" | "Travel";

// ── Role Requirement Row ─────────────────────────────────────────────────────
function RoleRow({
  req,
  onUpdate,
  onRemove,
}: {
  req: RoleRequirement;
  onUpdate: (r: RoleRequirement) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/10">
      <span className="font-semibold text-sm text-white flex-1 min-w-[160px]">{req.roleName}</span>

      {/* Qty */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">Qty</span>
        <input
          type="number"
          min={1}
          max={999}
          value={req.qty}
          onChange={(e) => onUpdate({ ...req, qty: Math.max(1, parseInt(e.target.value) || 1) })}
          className="w-16 h-8 bg-white/5 border border-white/10 rounded-lg px-2 text-sm outline-none focus:border-fuchsia-500/50 text-center"
        />
      </div>

      {/* Gender */}
      <div className="relative">
        <select
          value={req.gender}
          onChange={(e) => onUpdate({ ...req, gender: e.target.value as any })}
          className="h-8 bg-white/5 border border-white/10 rounded-lg px-2 pr-6 text-xs outline-none appearance-none focus:border-fuchsia-500/50"
        >
          <option value="Any">Any Gender</option>
          <option value="Male">Male Only</option>
          <option value="Female">Female Only</option>
        </select>
        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
      </div>

      {/* Age range */}
      <div className="flex items-center gap-1">
        <input
          type="number"
          placeholder="Min"
          value={req.minAge ?? ""}
          onChange={(e) => onUpdate({ ...req, minAge: e.target.value ? parseInt(e.target.value) : undefined })}
          className="w-14 h-8 bg-white/5 border border-white/10 rounded-lg px-2 text-xs outline-none focus:border-fuchsia-500/50 text-center"
        />
        <span className="text-gray-600 text-xs">–</span>
        <input
          type="number"
          placeholder="Max"
          value={req.maxAge ?? ""}
          onChange={(e) => onUpdate({ ...req, maxAge: e.target.value ? parseInt(e.target.value) : undefined })}
          className="w-14 h-8 bg-white/5 border border-white/10 rounded-lg px-2 text-xs outline-none focus:border-fuchsia-500/50 text-center"
        />
      </div>

      {/* Note */}
      <input
        type="text"
        placeholder="Note (optional)"
        value={req.note ?? ""}
        onChange={(e) => onUpdate({ ...req, note: e.target.value })}
        className="flex-1 min-w-[120px] h-8 bg-white/5 border border-white/10 rounded-lg px-2 text-xs outline-none focus:border-fuchsia-500/50"
      />

      <button
        onClick={onRemove}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5 text-red-400" />
      </button>
    </div>
  );
}

// ── Category + Role Picker ───────────────────────────────────────────────────
function RolePicker({
  selectedCategory,
  onCategoryChange,
  roleRequirements,
  onAdd,
}: {
  selectedCategory: RoleCategory | null;
  onCategoryChange: (c: RoleCategory) => void;
  roleRequirements: RoleRequirement[];
  onAdd: (role: RoleDefinition) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rolesInCategory = selectedCategory ? getRolesByCategory(selectedCategory) : [];
  const addedIds = new Set(roleRequirements.map((r) => r.roleId));

  const filtered = rolesInCategory.filter(
    (r) =>
      !addedIds.has(r.id) &&
      r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {/* Category selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {ROLE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => { onCategoryChange(cat); setOpen(true); setSearch(""); }}
            className={cn(
              "flex items-start gap-2 p-3 rounded-xl border text-left transition-all text-xs font-semibold leading-snug",
              selectedCategory === cat
                ? "bg-fuchsia-600/20 border-fuchsia-500/50 text-white"
                : "bg-white/[0.03] border-white/10 text-gray-400 hover:bg-white/[0.06] hover:text-white"
            )}
          >
            <span className="text-base leading-none shrink-0">{CATEGORY_EMOJI[cat]}</span>
            <span>{cat}</span>
          </button>
        ))}
      </div>

      {/* Role list for selected category */}
      {selectedCategory && open && (
        <div className="rounded-xl border border-fuchsia-500/20 bg-[#0e0e16] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-bold text-fuchsia-400 uppercase tracking-widest">
              {CATEGORY_EMOJI[selectedCategory]} {selectedCategory}
            </span>
            <button onClick={() => setOpen(false)} className="text-xs text-gray-500 hover:text-white">
              Close
            </button>
          </div>
          <div className="p-3 border-b border-white/5">
            <input
              type="text"
              placeholder="Search roles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm outline-none focus:border-fuchsia-500/50"
            />
          </div>
          <div className="max-h-56 overflow-y-auto divide-y divide-white/[0.04]">
            {filtered.length === 0 && (
              <p className="text-center text-gray-500 text-sm py-6">
                {addedIds.size > 0 && rolesInCategory.length === addedIds.size
                  ? "All roles in this category added!"
                  : "No matching roles"}
              </p>
            )}
            {filtered.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => onAdd(role)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors text-left group"
              >
                <span className="text-sm text-gray-300 group-hover:text-white">{role.name}</span>
                <Plus className="w-4 h-4 text-fuchsia-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AdminLocalsNewPage() {
  const [form, setForm] = useState({
    title: "",
    type: "Casting & Jobs" as ListingType,
    location: "",
    description: "",
    requirements: "",
    contact: "",
    date: "",
    salary: "",
    verified: true,
  });

  const [primaryCategory, setPrimaryCategory] = useState<RoleCategory | null>(null);
  const [roleRequirements, setRoleRequirements] = useState<RoleRequirement[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const addRole = (role: RoleDefinition) => {
    setRoleRequirements((prev) => [
      ...prev,
      { roleId: role.id, roleName: role.name, qty: 1, gender: "Any" },
    ]);
  };

  const updateRole = (idx: number, updated: RoleRequirement) => {
    setRoleRequirements((prev) => prev.map((r, i) => (i === idx ? updated : r)));
  };

  const removeRole = (idx: number) => {
    setRoleRequirements((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalHeadcount = roleRequirements.reduce((s, r) => s + r.qty, 0);

  const handlePost = async () => {
    if (!form.title || !form.location || !form.description) {
      setError("Title, Location, and Description are required.");
      return;
    }
    if (roleRequirements.length === 0) {
      setError("Please add at least one role requirement.");
      return;
    }
    setError("");
    setPosting(true);
    try {
      const requirements = form.requirements.split("\n").map((r) => r.trim()).filter(Boolean);
      await admin.createListing({
        title: form.title,
        type: form.type,
        location: form.location,
        city: form.location.split(",")[0].trim(),
        description: form.description,
        requirements,
        contact: form.contact || undefined,
        date: form.date || undefined,
        salary: form.salary || undefined,
        postedBy: "Market Underworld Locals",
        verified: form.verified,
        primaryCategory: primaryCategory ?? undefined,
        roleRequirements,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish the listing.");
    } finally {
      setPosting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center">
        <CheckCircle2 className="w-20 h-20 text-green-400" />
        <h2 className="text-3xl font-black text-white">Listing Published!</h2>
        <p className="text-gray-400 max-w-md">
          Your event posting is now live on the Locals Hub.{" "}
          <strong className="text-white">{totalHeadcount} total roles</strong> across{" "}
          {roleRequirements.length} position{roleRequirements.length > 1 ? "s" : ""} posted.
        </p>
        <div className="flex gap-4">
          <Link href="/locals">
            <button className="h-12 px-6 rounded-xl bg-white/10 hover:bg-white/20 font-bold transition-colors">
              View Live Page
            </button>
          </Link>
          <Link href="/admin/locals">
            <button className="h-12 px-6 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 font-bold transition-colors">
              Manage Listings
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-10">
      {/* Header */}
      <div>
        <Link href="/admin/locals" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Manage Listings
        </Link>
        <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-bold uppercase tracking-widest mb-2">
          <Megaphone className="w-4 h-4" /> Post New Listing
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">New Casting Call / Event</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details below. This will instantly appear on the public Locals Hub.</p>
      </div>

      {/* Basic Info */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-8 space-y-6">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Basic Info</h2>

        {/* Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Listing Type *</label>
            <div className="relative">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as ListingType })}
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none appearance-none focus:border-fuchsia-500/50 transition-colors"
              >
                <option value="Casting & Jobs">Casting &amp; Jobs</option>
                <option value="Events">Events</option>
                <option value="Matchmaking">Matchmaking</option>
                <option value="Travel">Travel</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
          <div className="flex items-end">
            <div className="flex items-center justify-between w-full p-3 rounded-xl bg-green-500/5 border border-green-500/20">
              <div>
                <div className="font-bold text-sm text-white">Mark as Verified</div>
                <div className="text-[11px] text-gray-500 mt-0.5">Shows green ✓ badge</div>
              </div>
              <button
                onClick={() => setForm({ ...form, verified: !form.verified })}
                className={cn(
                  "w-11 h-6 rounded-full border-2 transition-colors relative shrink-0",
                  form.verified ? "bg-green-500 border-green-500" : "bg-white/10 border-white/20"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
                  form.verified ? "left-5" : "left-0.5"
                )} />
              </button>
            </div>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Title *</label>
          <input
            type="text"
            placeholder="e.g. Wedding Event — BKC Mumbai | Needs 15 Staff"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-fuchsia-500/50 transition-colors"
          />
        </div>

        {/* Location */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Location *</label>
          <input
            type="text"
            placeholder="e.g. Mumbai / Delhi NCR / Goa / Jodhpur"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-fuchsia-500/50 transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Description *</label>
          <textarea
            rows={5}
            placeholder="Describe the event, what you need, project info, shoot details, stay & food, pay structure..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-fuchsia-500/50 transition-colors resize-none"
          />
        </div>

        {/* Contact + Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Contact Info</label>
            <input
              type="text"
              placeholder="WhatsApp number / Email"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-fuchsia-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Date / Duration</label>
            <input
              type="text"
              placeholder="e.g. Oct 6-9 / 6 Months from Nov"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-fuchsia-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Salary */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Pay / Salary <span className="text-gray-600 normal-case font-normal">(optional)</span></label>
          <input
            type="text"
            placeholder="e.g. ₹33k/month + Stay & Food / ₹3000/night"
            value={form.salary}
            onChange={(e) => setForm({ ...form, salary: e.target.value })}
            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-fuchsia-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Role Requirements — many-to-many */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-8 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Role Requirements *</h2>
            <p className="text-xs text-gray-600 mt-1">
              Select a category, then pick roles. Set qty, gender & age per role.
            </p>
          </div>
          {roleRequirements.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20">
              <Users className="w-3.5 h-3.5 text-fuchsia-400" />
              <span className="text-xs font-bold text-fuchsia-300">
                {totalHeadcount} people · {roleRequirements.length} roles
              </span>
            </div>
          )}
        </div>

        {/* Category + role picker */}
        <RolePicker
          selectedCategory={primaryCategory}
          onCategoryChange={setPrimaryCategory}
          roleRequirements={roleRequirements}
          onAdd={addRole}
        />

        {/* Selected role requirements list */}
        {roleRequirements.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              Selected Roles — set qty, gender & age for each
            </div>
            {roleRequirements.map((req, idx) => (
              <RoleRow
                key={req.roleId + idx}
                req={req}
                onUpdate={(updated) => updateRole(idx, updated)}
                onRemove={() => removeRole(idx)}
              />
            ))}
            {/* Summary */}
            <div className="mt-4 p-4 rounded-xl bg-fuchsia-500/5 border border-fuchsia-500/10 text-sm text-gray-400">
              <strong className="text-fuchsia-300">Summary:</strong>{" "}
              {roleRequirements.map((r) => `${r.qty}× ${r.roleName}`).join(" · ")}
            </div>
          </div>
        )}
      </div>

      {/* Error + Submit */}
      <div className="space-y-4">
        {error && (
          <p className="text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </p>
        )}
        <button
          onClick={handlePost}
          disabled={posting}
          className="w-full h-14 rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-60 font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(217,70,239,0.3)]"
        >
          <Send className="w-5 h-5" /> {posting ? "Publishing..." : "Publish to Locals Hub"}
        </button>
      </div>
    </div>
  );
}
