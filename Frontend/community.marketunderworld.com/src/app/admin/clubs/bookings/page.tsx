"use client";

import { useCallback, useEffect, useState } from "react";
import { admin, type BookingStatus, type ClubBooking } from "@/lib/api/nightlife";

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending:   "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  declined:  "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-600",
};

export default function AdminClubBookingsPage() {
  const [allBookings, setAllBookings] = useState<ClubBooking[]>([]);
  const [filter, setFilter] = useState<BookingStatus | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await admin.bookings({});
      setAllBookings(result.items);
    } catch (err: any) {
      setError(err?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (id: string, status: BookingStatus) => {
    setError("");
    try {
      await admin.setBookingStatus(id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update request");
    }
  };

  const counts = {
    pending:   allBookings.filter(b => b.status === "pending").length,
    confirmed: allBookings.filter(b => b.status === "confirmed").length,
    declined:  allBookings.filter(b => b.status === "declined").length,
  };

  const bookings = filter === "all" ? allBookings : allBookings.filter(b => b.status === filter);

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Guest List &amp; VIP Requests</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Requests submitted from club pages. Confirming does not contact the guest — use the phone/email shown.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Pending Review", count: counts.pending, color: "bg-amber-50 border-amber-200 text-amber-700" },
          { label: "Confirmed",      count: counts.confirmed, color: "bg-green-50 border-green-200 text-green-700" },
          { label: "Declined",       count: counts.declined, color: "bg-red-50 border-red-200 text-red-700" },
        ].map(({ label, count, color }) => (
          <div key={label} className={`border rounded-xl p-4 ${color}`}>
            <p className="text-2xl font-black">{count}</p>
            <p className="text-xs font-semibold mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(["pending", "confirmed", "declined", "cancelled", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize border transition-all ${
              filter === f
                ? "bg-fuchsia-600 text-white border-fuchsia-600"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500">
              <th className="p-4 font-semibold">Guest</th>
              <th className="p-4 font-semibold">Club</th>
              <th className="p-4 font-semibold">Type</th>
              <th className="p-4 font-semibold">Date</th>
              <th className="p-4 font-semibold">Party</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">
                  <span className="inline-block animate-spin mr-2">⏳</span>Loading…
                </td>
              </tr>
            )}
            {!loading && bookings.length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-gray-400">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="font-medium">No {filter === "all" ? "" : filter} requests yet.</p>
                  <p className="text-sm mt-1">Bookings from guest list and VIP table forms will appear here.</p>
                </td>
              </tr>
            )}
            {bookings.map((b) => (
              <tr key={b.id} className="align-top hover:bg-gray-50/50 transition-colors">
                <td className="p-4">
                  <div className="font-semibold text-gray-900">{b.firstName} {b.lastName}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{b.phone}</div>
                  <div className="text-gray-500 text-xs">{b.email}</div>
                </td>
                <td className="p-4">
                  <div className="font-medium">{b.club?.name ?? "—"}</div>
                  <div className="text-gray-500 text-xs">{b.club?.city}</div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${
                    b.kind === "vip_table"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}>
                    {b.kind === "vip_table" ? "🥂 VIP Table" : "📋 Guest List"}
                  </span>
                  {b.tablePackage && <div className="text-gray-500 text-xs mt-1">{b.tablePackage}</div>}
                  {b.notes && <div className="text-gray-400 text-xs mt-1 max-w-[160px] truncate">{b.notes}</div>}
                </td>
                <td className="p-4 whitespace-nowrap text-sm">{b.visitDate}</td>
                <td className="p-4 text-sm">
                  {b.kind === "vip_table"
                    ? `${b.groupSize} guests`
                    : `${b.males}M / ${b.females}F`}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-semibold capitalize ${STATUS_STYLE[b.status]}`}>
                    {b.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    {b.status !== "confirmed" && (
                      <button
                        onClick={() => decide(b.id, "confirmed")}
                        className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
                      >
                        ✓ Confirm
                      </button>
                    )}
                    {b.status !== "declined" && (
                      <button
                        onClick={() => decide(b.id, "declined")}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium hover:bg-gray-50 transition-colors"
                      >
                        ✕ Decline
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
