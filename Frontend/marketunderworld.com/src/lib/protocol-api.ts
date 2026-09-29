/**
 * Protocol platform data client — live, backed by the insiders-service Postgres tables
 * (migration 008: protocol_*). Replaces src/data/mockData.ts. Returns UI-shaped objects so the
 * existing page JSX stays unchanged; writes go through the same real client (gateway when authed).
 */
import { supabase } from "@/integrations/supabase/client";

// ── formatters ─────────────────────────────────────────────────────────────────
export const relTime = (iso?: string | null) => {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24); if (d < 7) return `${d} day${d > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString();
};
export const shortDate = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");
const list = async (b: any) => (await b).data || [];

// ── UI-shape mappers (DB row → the shape the pages already render) ───────────────
export const mapExpert = (r: any) => ({
  id: r.id, name: r.name, email: r.email, specialty: r.title, title: r.title,
  country: r.country, avatar: r.avatar, status: r.status, rating: Number(r.rating) || 0,
  students: r.students ?? 0, revenue: Number(r.revenue) || 0, joinedAt: shortDate(r.created_at),
});
export const mapStudent = (r: any) => ({
  id: r.id, name: r.name, email: r.email, avatar: r.avatar, status: r.status,
  lastActive: relTime(r.last_active_at), joined: shortDate(r.joined_at), expertId: r.expert_id,
});
export const mapPost = (r: any) => ({
  id: r.id, type: r.type, content: r.content, duration: r.duration,
  author: r.author_name || "Expert", avatar: r.avatar, time: relTime(r.created_at),
  thumbnail: r.content, likes: r.likes ?? 0, comments: r.comments ?? 0, isPinned: !!r.is_pinned,
});
export const mapCall = (r: any) => ({
  id: r.id, title: r.title, type: r.type, status: r.status,
  attendees: r.attendees ?? 0, duration: r.duration,
  scheduled: r.scheduled_at ? new Date(r.scheduled_at).toLocaleString() : "TBD", scheduledAt: r.scheduled_at,
});
export const mapInvite = (r: any) => ({
  id: r.id, code: r.code, link: r.link, expiry: r.expiry,
  maxUsers: r.max_users ?? 0, usedBy: r.used_by ?? 0, price: r.price, status: r.status,
});
export const mapProduct = (r: any) => ({
  id: r.id, type: r.type, title: r.title, description: r.description,
  price: Number(r.price) || 0, originalPrice: r.original_price != null ? Number(r.original_price) : null,
  sales: r.sales ?? 0, featured: !!r.featured,
});
export const mapCountry = (r: any) => ({
  id: r.id, name: r.name, code: r.code, flag: r.flag,
  experts: r.experts ?? 0, students: r.students ?? 0, revenue: Number(r.revenue) || 0,
});

// ── API ──────────────────────────────────────────────────────────────────────
export const protocolApi = {
  experts: {
    list: async () => (await list(supabase.from("protocol_experts").select("*").order("revenue", { ascending: false }))).map(mapExpert),
    setStatus: (id: string, status: string) => supabase.from("protocol_experts").update({ status }).eq("id", id),
  },
  students: {
    list: async () => (await list(supabase.from("protocol_students").select("*").order("created_at", { ascending: false }))).map(mapStudent),
    remove: (id: string) => supabase.from("protocol_students").delete().eq("id", id),
  },
  feed: {
    list: async () => (await list(supabase.from("protocol_feed_posts").select("*").order("created_at", { ascending: false }))).map(mapPost),
    create: (v: { type: string; content: string; duration?: string; author_name?: string; avatar?: string }) =>
      supabase.from("protocol_feed_posts").insert(v).select(),
    setPinned: (id: string, is_pinned: boolean) => supabase.from("protocol_feed_posts").update({ is_pinned }).eq("id", id),
  },
  calls: {
    list: async () => (await list(supabase.from("protocol_calls").select("*").order("scheduled_at", { ascending: true }))).map(mapCall),
    create: (v: { title: string; type: string; status?: string; duration?: string; scheduled_at?: string }) =>
      supabase.from("protocol_calls").insert(v).select(),
  },
  invites: {
    list: async () => (await list(supabase.from("protocol_invites").select("*").order("created_at", { ascending: false }))).map(mapInvite),
    create: (v: { code: string; link: string; expiry: string; max_users: number; price: string; status?: string }) =>
      supabase.from("protocol_invites").insert(v).select(),
    remove: (id: string) => supabase.from("protocol_invites").delete().eq("id", id),
  },
  products: {
    list: async () => (await list(supabase.from("protocol_products").select("*").order("created_at", { ascending: false }))).map(mapProduct),
    create: (v: { type: string; title: string; description?: string; price: number }) =>
      supabase.from("protocol_products").insert(v).select(),
  },
  countries: {
    list: async () => (await list(supabase.from("protocol_countries").select("*").order("revenue", { ascending: false }))).map(mapCountry),
  },
  orders: {
    create: (v: { product_id: string; amount: number }) => supabase.from("protocol_orders").insert(v).select(),
  },
};

export default protocolApi;
