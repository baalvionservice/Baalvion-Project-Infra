"use client";

import { useCallback, useEffect, useState } from "react";
import { access, type Permission, type StaffMember } from "@/lib/api/staff";
import { useAdminAccess } from "@/components/admin/admin-access";

const box = "bg-white rounded-xl shadow-sm border border-gray-100";
const input = "w-full border p-2.5 rounded-lg outline-none focus:border-fuchsia-500 text-sm";
const msg = (e: unknown, f: string) => (e instanceof Error ? e.message : f);

const TIERS: { id: "super" | "admin" | "moderator"; name: string; who: string; can: Permission[] }[] = [
  { id: "super", name: "Super admin", who: "Comes from the platform login role (super_admin / platform_admin). Cannot be granted here.", can: ["content.manage", "content.handle", "verify.review", "bounty.manage", "support.handle", "announce.publish", "audit.view", "notify.send", "kyc.review", "staff.manage"] },
  { id: "admin", name: "Admin", who: "country_admin by platform role, or granted here.", can: ["content.manage", "content.handle", "verify.review", "bounty.manage", "support.handle", "announce.publish", "audit.view", "notify.send"] },
  { id: "moderator", name: "Moderator", who: "Granted here. Works the queues only.", can: ["content.handle", "verify.review", "support.handle"] },
];

const PERM_LABEL: Record<Permission, string> = {
  "content.manage": "Create and edit clubs, events, listings; cancel sessions",
  "content.handle": "Decide bookings and Locals applications",
  "verify.review": "Approve candidates, employers and teachers",
  "bounty.manage": "Bug bounty tasks, reports, chat and payouts",
  "support.handle": "Answer support tickets",
  "announce.publish": "Publish site-wide announcements",
  "audit.view": "Read the audit log",
  "notify.send": "Send seller / listing notifications",
  "kyc.review": "Open identity documents and decide KYC",
  "staff.manage": "Grant and remove staff access",
};

export default function StaffAccessPage() {
  const { tier } = useAdminAccess();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ userId: "", tier: "moderator" as "admin" | "moderator", label: "" });
  const isSuper = tier === "super";

  const load = useCallback(async () => {
    try { setError(""); setStaff(await access.list()); } catch (e) { setError(msg(e, "Could not load staff")); }
  }, []);
  useEffect(() => { if (isSuper) load(); }, [isSuper, load]);

  const grant = async () => {
    if (!/^[0-9a-f-]{36}$/i.test(form.userId.trim())) return setError("Paste the person's user id (a UUID from the User Registry).");
    try { setError(""); await access.grant(form.userId.trim(), form.tier, form.label.trim()); setForm({ ...form, userId: "", label: "" }); await load(); } catch (e) { setError(msg(e, "Could not grant access")); }
  };
  const revoke = async (m: StaffMember) => {
    if (!confirm(`Remove ${m.tier} access for ${m.label ?? m.userId}?`)) return;
    try { await access.revoke(m.userId); await load(); } catch (e) { setError(msg(e, "Could not remove access")); }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Staff &amp; access</h1>
        <p className="text-gray-500 mt-2">Three levels decide what the console lets someone do. Every grant and removal is written to the audit log.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {TIERS.map((t) => (
          <div key={t.id} className={`${box} p-5 space-y-3`}>
            <div>
              <div className="font-semibold text-lg">{t.name}{tier === t.id && <span className="ml-2 text-xs text-fuchsia-600">you</span>}</div>
              <div className="text-xs text-gray-500">{t.who}</div>
            </div>
            <ul className="text-sm space-y-1.5">
              {(Object.keys(PERM_LABEL) as Permission[]).map((p) => (
                <li key={p} className={t.can.includes(p) ? "text-gray-800" : "text-gray-300 line-through"}>{t.can.includes(p) ? "✓" : "✗"} {PERM_LABEL[p]}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {!isSuper ? (
        <p className={`${box} p-6 text-sm text-gray-500`}>Only a super admin can grant or remove access.</p>
      ) : (
        <>
          <div className={`${box} p-6 space-y-3`}>
            <h2 className="font-semibold">Grant access</h2>
            <div className="grid md:grid-cols-4 gap-3">
              <input className={`${input} md:col-span-2`} placeholder="User id (UUID, from the User Registry)" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} />
              <input className={input} placeholder="Name or email, for display" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
              <select className={input} value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value as "admin" | "moderator" })}><option value="moderator">Moderator</option><option value="admin">Admin</option></select>
            </div>
            <button onClick={grant} className="px-5 py-2.5 rounded-lg bg-fuchsia-600 text-white text-sm font-medium hover:bg-fuchsia-700">Grant</button>
          </div>

          <div className={`${box} divide-y divide-gray-50`}>
            {staff.length === 0 && <p className="p-8 text-center text-gray-400 text-sm">No granted staff yet. Super admins and country admins come from their platform role and are not listed here.</p>}
            {staff.map((m) => (
              <div key={m.userId} className="p-4 flex items-center justify-between gap-3">
                <div><div className="font-medium">{m.label ?? "Unnamed"}</div><div className="text-xs text-gray-500">{m.userId} · granted {new Date(m.grantedAt).toLocaleDateString("en-IN")}</div></div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 rounded-md text-xs font-semibold uppercase bg-gray-100">{m.tier}</span>
                  <button onClick={() => revoke(m)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium hover:bg-gray-50">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
