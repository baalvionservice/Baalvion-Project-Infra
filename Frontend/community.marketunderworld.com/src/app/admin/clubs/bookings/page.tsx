"use client";

import { useCallback, useEffect, useState } from "react";
import { admin, type BookingStatus, type ClubBooking } from "@/lib/api/nightlife";

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-600",
};

export default function AdminClubBookingsPage() {
  const [bookings, setBookings] = useState<ClubBooking[]>([]);
  const [filter, setFilter] = useState<BookingStatus | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      setBookings((await admin.bookings(filter === "all" ? {} : { status: filter })).items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load requests");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const decide = async (id: string, status: BookingStatus) => {
    try {
      setError("");
      await admin.setBookingStatus(id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update request");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Guest List & VIP Requests</h1>
        <p className="text-gray-500 mt-2">Requests submitted from club pages. Confirming a request does not contact the guest; do that using the phone or email shown.</p>
      </div>

      <div className="flex gap-2 mb-6">
        {(["pending", "confirmed", "declined", "cancelled", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize border ${filter === f ? "bg-fuchsia-600 text-white border-fuchsia-600" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

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
            {loading && <tr><td colSpan={7} className="p-8 text-center text-gray-400">Loading…</td></tr>}
            {!loading && bookings.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400">No requests.</td></tr>}
            {bookings.map((b) => (
              <tr key={b.id} className="align-top">
                <td className="p-4">
                  <div className="font-medium">{b.firstName} {b.lastName}</div>
                  <div className="text-gray-500">{b.phone}</div>
                  <div className="text-gray-500">{b.email}</div>
                </td>
                <td className="p-4">{b.club?.name ?? "—"}<div className="text-gray-500">{b.club?.city}</div></td>
                <td className="p-4">
                  {b.kind === "vip_table" ? "VIP table" : "Guest list"}
                  {b.tablePackage && <div className="text-gray-500">{b.tablePackage}</div>}
                  {b.notes && <div className="text-gray-500 max-w-xs">{b.notes}</div>}
                </td>
                <td className="p-4 whitespace-nowrap">{b.visitDate}</td>
                <td className="p-4">{b.kind === "vip_table" ? `${b.groupSize} guests` : `${b.males}M / ${b.females}F`}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded-md text-xs font-semibold capitalize ${STATUS_STYLE[b.status]}`}>{b.status}</span></td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    {b.status !== "confirmed" && <button onClick={() => decide(b.id, "confirmed")} className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700">Confirm</button>}
                    {b.status !== "declined" && <button onClick={() => decide(b.id, "declined")} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium hover:bg-gray-50">Decline</button>}
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
