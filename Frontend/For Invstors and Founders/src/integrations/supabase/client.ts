// Supabase-compatible adapter for the self-hosted Baalvion Insiders backend
// (Node.js + PostgreSQL, see Backend/insiders-service).
//
// This reproduces the slice of the supabase-js interface the app uses
// (`.from().select()/insert()/update()/delete()/upsert()`, `.rpc()`, `.auth`,
// `.storage`, `.functions`, `.channel`) and translates it into REST calls
// against the new service. Keeping the `supabase` export name means the rest of
// the app is unchanged. Authorization that RLS used to enforce now lives in the
// backend's per-table policy engine.

const API_BASE: string =
  (import.meta as any).env?.VITE_API_URL || "https://api.baalvion.com/api/v1/ecosystem/insiders/v1";
const SESSION_KEY = "insiders.session";

// ── Session storage ───────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  email_verified?: boolean;
  roles?: string[];
  user_metadata?: { username?: string | null; full_name?: string | null; avatar_url?: string | null };
}
export interface Session {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

const loadSession = (): Session | null => {
  try { const s = localStorage.getItem(SESSION_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
};
const saveSession = (s: Session | null) => {
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else localStorage.removeItem(SESSION_KEY);
};

type AuthEvent = "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED";
const listeners = new Set<(event: AuthEvent, session: Session | null) => void>();
const emit = (event: AuthEvent, session: Session | null) => listeners.forEach((cb) => cb(event, session));

// ── Low-level request with one transparent refresh-on-401 retry ────────────────
async function tryRefresh(): Promise<boolean> {
  const session = loadSession();
  if (!session?.refresh_token) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      saveSession(json.data.session);
      emit("TOKEN_REFRESHED", json.data.session);
      return true;
    }
  } catch { /* fallthrough */ }
  saveSession(null);
  emit("SIGNED_OUT", null);
  return false;
}

async function apiFetch(path: string, init: RequestInit, retry = true): Promise<any> {
  const session = loadSession();
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 401 && retry && session?.refresh_token) {
    if (await tryRefresh()) return apiFetch(path, init, false);
  }
  let json: any = null;
  try { json = await res.json(); } catch { /* no body */ }
  return { res, json };
}

const errFrom = (json: any) =>
  json?.error ? { message: json.error.message, code: json.error.code, details: json.error.details } : { message: "Network error" };

// ── Query builder (thenable, mirrors PostgrestFilterBuilder) ───────────────────
interface QuerySpec {
  table: string;
  action: "select" | "insert" | "update" | "delete" | "upsert";
  columns: string;
  filters: { col: string; op: string; val: any }[];
  order: { col: string; ascending: boolean }[];
  limit: number | null;
  offset: number | null;
  count: "exact" | null;
  head: boolean;
  single: boolean;
  maybeSingle: boolean;
  values: any;
  onConflict: string | null;
  returning: boolean;
}

class QueryBuilder<T = any> implements PromiseLike<{ data: T; error: any; count: number | null }> {
  private spec: QuerySpec;
  constructor(table: string) {
    this.spec = {
      table, action: "select", columns: "*", filters: [], order: [],
      limit: null, offset: null, count: null, head: false,
      single: false, maybeSingle: false, values: undefined, onConflict: null, returning: false,
    };
  }

  select(columns = "*", opts?: { count?: "exact"; head?: boolean }) {
    this.spec.columns = columns || "*";
    if (this.spec.action === "select") {
      if (opts?.count) this.spec.count = opts.count;
      if (opts?.head) this.spec.head = true;
    } else {
      this.spec.returning = true; // .insert(...).select() / .update(...).select()
    }
    return this;
  }
  insert(values: any) { this.spec.action = "insert"; this.spec.values = values; return this; }
  update(values: any) { this.spec.action = "update"; this.spec.values = values; return this; }
  upsert(values: any, opts?: { onConflict?: string }) {
    this.spec.action = "upsert"; this.spec.values = values; this.spec.onConflict = opts?.onConflict || null; return this;
  }
  delete() { this.spec.action = "delete"; return this; }

  private filter(col: string, op: string, val: any) { this.spec.filters.push({ col, op, val }); return this; }
  eq(c: string, v: any) { return this.filter(c, "eq", v); }
  neq(c: string, v: any) { return this.filter(c, "neq", v); }
  gt(c: string, v: any) { return this.filter(c, "gt", v); }
  gte(c: string, v: any) { return this.filter(c, "gte", v); }
  lt(c: string, v: any) { return this.filter(c, "lt", v); }
  lte(c: string, v: any) { return this.filter(c, "lte", v); }
  like(c: string, v: any) { return this.filter(c, "like", v); }
  ilike(c: string, v: any) { return this.filter(c, "ilike", v); }
  in(c: string, v: any[]) { return this.filter(c, "in", v); }
  is(c: string, v: any) { return this.filter(c, "is", v); }

  order(col: string, opts?: { ascending?: boolean }) {
    this.spec.order.push({ col, ascending: opts?.ascending !== false });
    return this;
  }
  limit(n: number) { this.spec.limit = n; return this; }
  range(from: number, to: number) { this.spec.offset = from; this.spec.limit = to - from + 1; return this; }
  single() { this.spec.single = true; return this; }
  maybeSingle() { this.spec.maybeSingle = true; return this; }

  private async exec() {
    const { res, json } = await apiFetch("/db/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(this.spec),
    });
    if (!json || !json.success) return { data: null as any, error: errFrom(json), count: null };
    return { data: json.data.data as T, error: null, count: json.data.count ?? null };
  }

  then<R1 = any, R2 = never>(
    onfulfilled?: ((v: { data: T; error: any; count: number | null }) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: any) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    return this.exec().then(onfulfilled as any, onrejected as any);
  }
}

// ── Auth ───────────────────────────────────────────────────────────────────────
const auth = {
  async getSession() {
    return { data: { session: loadSession() }, error: null };
  },
  async getUser() {
    const session = loadSession();
    if (!session) return { data: { user: null }, error: null };
    // Validate / refresh the profile from the server.
    const { res, json } = await apiFetch("/auth/me", { method: "GET" });
    if (res.ok && json?.success) {
      const updated = { ...session, user: json.data.user };
      saveSession(updated);
      return { data: { user: json.data.user }, error: null };
    }
    return { data: { user: session.user }, error: null };
  },
  onAuthStateChange(cb: (event: AuthEvent, session: Session | null) => void) {
    listeners.add(cb);
    // Fire current state asynchronously, matching supabase-js behaviour.
    Promise.resolve().then(() => cb(loadSession() ? "SIGNED_IN" : "SIGNED_OUT", loadSession()));
    return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
  },
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    // Phase 5D HYBRID: prefer auth-service (canonical RS256); fall back to the island backend
    // (HS256) so existing island users are NEVER locked out. The resulting RS256 session then
    // flows to .from()/.rpc() data calls, which the island backend accepts via its dual verifier
    // (Phase 3B). Supabase adapter, .from() queries, storage, functions are UNCHANGED.
    const AUTH_URL = (import.meta as any).env?.VITE_AUTH_URL || "http://localhost:3001/v1/auth";
    try {
      const r = await fetch(`${AUTH_URL}/login`, {
        method: "POST", credentials: "include", // sets the HttpOnly refresh cookie (cookie-aware)
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const aj = await r.json();
      if (r.ok && aj?.success && aj.data?.accessToken) {
        const u = aj.data.user || {};
        const session: Session = {
          access_token: aj.data.accessToken,
          refresh_token: aj.data.refreshToken,
          user: {
            id: String(u.id ?? ""),
            email: u.email ?? email,
            roles: Array.isArray(u.roles) ? u.roles : (u.role ? [u.role] : []),
            user_metadata: { full_name: u.fullName ?? null, avatar_url: u.avatarUrl ?? null },
          },
        };
        saveSession(session);
        emit("SIGNED_IN", session);
        return { data: { user: session.user, session }, error: null };
      }
    } catch { /* auth-service unreachable / user not migrated → fall back to legacy island login */ }
    // FALLBACK (legacy island HS256 login — UNCHANGED): keeps users working during migration.
    const { res, json } = await apiFetch("/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok || !json?.success) return { data: { user: null, session: null }, error: errFrom(json) };
    saveSession(json.data.session);
    emit("SIGNED_IN", json.data.session);
    return { data: { user: json.data.user, session: json.data.session }, error: null };
  },
  async signUp({ email, password, options }: { email: string; password: string; options?: { data?: any; emailRedirectTo?: string } }) {
    const meta = options?.data || {};
    const { res, json } = await apiFetch("/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, username: meta.username, full_name: meta.full_name }),
    });
    if (!res.ok || !json?.success) return { data: { user: null, session: null }, error: errFrom(json) };
    saveSession(json.data.session);
    emit("SIGNED_IN", json.data.session);
    return { data: { user: json.data.user, session: json.data.session }, error: null };
  },
  async signOut() {
    const session = loadSession();
    await apiFetch("/auth/logout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session?.refresh_token }),
    });
    saveSession(null);
    emit("SIGNED_OUT", null);
    return { error: null };
  },
  async resetPasswordForEmail(email: string, _opts?: { redirectTo?: string }) {
    const { json } = await apiFetch("/auth/forgot-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    // dev: backend returns reset_token so the flow is testable without email.
    return { data: json?.data || {}, error: json?.success ? null : errFrom(json) };
  },
  async updateUser({ password }: { password: string }) {
    const { res, json } = await apiFetch("/auth/update-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok || !json?.success) return { data: { user: null }, error: errFrom(json) };
    return { data: { user: loadSession()?.user || null }, error: null };
  },
  // Accounts are verified on registration in this self-hosted setup, so there is
  // nothing to resend — kept so the Verify-Email page stays functional.
  async resend(_opts: { type?: string; email?: string; options?: any }) {
    return { data: {}, error: null };
  },
  // Used by the rewired reset-password flow (token from the email link).
  async resetPasswordWithToken(token: string, password: string) {
    const { res, json } = await apiFetch("/auth/reset-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    if (!res.ok || !json?.success) return { error: errFrom(json) };
    return { error: null };
  },
};

// ── RPC ─────────────────────────────────────────────────────────────────────────
async function rpc(fn: string, args?: Record<string, any>) {
  const { res, json } = await apiFetch(`/rpc/${fn}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args || {}),
  });
  if (!res.ok || !json?.success) return { data: null, error: errFrom(json) };
  return { data: json.data.data ?? json.data, error: null };
}

// ── Storage ──────────────────────────────────────────────────────────────────────
const storage = {
  from(bucket: string) {
    return {
      async upload(path: string, file: File | Blob, _opts?: any) {
        const form = new FormData();
        form.append("path", path);
        form.append("file", file);
        const { res, json } = await apiFetch(`/storage/${bucket}/upload`, { method: "POST", body: form });
        if (!res.ok || !json?.success) return { data: null, error: errFrom(json) };
        return { data: { path: json.data.path, fullPath: json.data.fullPath }, error: null };
      },
      getPublicUrl(path: string) {
        const base = API_BASE.replace(/\/v1$/, "");
        return { data: { publicUrl: `${base}/storage/${bucket}/${path}` } };
      },
      async createSignedUrl(path: string, _expiresIn: number) {
        // Local storage has no signing; the public URL is returned (dev parity).
        const base = API_BASE.replace(/\/v1$/, "");
        return { data: { signedUrl: `${base}/storage/${bucket}/${path}` }, error: null };
      },
    };
  },
};

// ── Edge functions ───────────────────────────────────────────────────────────────
const functions = {
  async invoke(name: string, opts?: { body?: any }) {
    const { res, json } = await apiFetch(`/functions/${name}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts?.body || {}),
    });
    if (!res.ok || !json?.success) return { data: null, error: errFrom(json) };
    return { data: json.data, error: null };
  },
};

// ── Realtime (no-op shim) ────────────────────────────────────────────────────────
// Live push was Supabase Realtime; the app now polls (see NotificationBell). These
// stubs keep existing channel call-sites harmless no-ops.
function channel(_name: string) {
  const ch: any = { on: () => ch, subscribe: () => ch, unsubscribe: () => {} };
  return ch;
}
const removeChannel = (_ch: any) => {};

export const supabase = {
  from: <T = any>(table: string) => new QueryBuilder<T>(table),
  rpc,
  auth,
  storage,
  functions,
  channel,
  removeChannel,
};

export type { QueryBuilder };
