"use client";

import React, { useState } from "react";
import { Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { bookingApi } from "@/lib/api/client";

/**
 * Opens the video consultation room for a booking. The room link comes from the
 * backend (Daily.co in production, Jitsi Meet as the keyless default), scoped to
 * the booking's participants. Opens in a new tab so the dashboard stays put.
 */
export default function JoinVideoButton({
  bookingId,
  label = "Join consultation",
  className,
  size = "sm",
}: {
  bookingId: string | number;
  label?: string;
  className?: string;
  size?: "sm" | "default" | "lg";
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const join = async () => {
    setLoading(true);
    try {
      const res = await bookingApi.videoRoom(String(bookingId));
      const url = res.data?.data?.roomUrl || res.data?.roomUrl;
      if (!url) throw new Error("No room available");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Could not open the room", description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={join} disabled={loading} size={size} className={className || "bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"}>
      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Video className="w-4 h-4 mr-2" />}
      {label}
    </Button>
  );
}
