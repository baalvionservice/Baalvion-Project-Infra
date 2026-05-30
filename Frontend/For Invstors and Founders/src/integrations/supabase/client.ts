// Supabase-compatible adapter for the self-hosted Baalvion Insiders backend, wired to the
// canonical auth-gateway (BFF). Authentication is cookie-based (HttpOnly access/refresh +
// JS-readable csrf_token); there is NO bearer token in JS and NO localStorage session.
//
// Two transport paths (the gateway /api/* requires a session, so anonymous reads can't use it):
//   • Authenticated  → ${GATEWAY}/api/insiders/v1/...   (cookie + x-csrf-token, identity injected
//                       by the gateway and verified by the island's bffBridge). Auth lives at
//                       ${GATEWAY}/auth/{login,register,refresh,logout,me}.
//   • Anonymous/public → ${INSIDERS}/v1/...             (direct to insiders-service; only public
//                       table policies succeed — anything auth-gated 401s because the backend
//                       trusts ONLY signed gateway identity, so there is no privilege leak).
//
// In dev both bases are same-origin Vite proxies (/auth-bff, /insiders-api) so the gateway cookies
// work without CORS. This reproduces the slice of supabase-js the app uses (.from().select()/insert()/
// update()/delete()/upsert(), .rpc(), .auth, .storage, .functions, .channel); keeping the `supabase`
// export name means the rest of the app is unchanged. Authorization that RLS used to enforce lives in
// the backend's per-table policy engine; identity is provisioned just-in-time (see backend
// middleware/gatewayIdentity.js) and the canonical local user id is read via /whoami.

const GATEWAY: string = (import.meta as any).env?.VITE_GATEWAY_URL || "/auth-bff";
const INSIDERS: string = (import.meta as any).env?.VITE_INSIDERS_URL || "/insiders-api";
const DATA_PREFIX = "/api/insiders/v1";   // gateway proxy → insiders-service /v1
const DIRECT_PREFIX = "/v1";              // direct insiders-service mount
const MIRROR_KEY = "insiders.user";       // optimistic cache of the public user shape (no secrets)

// ── Auth user / session shapes ─────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  email_verified?: boolean;
  roles?: string[];
  user_metadata?: { username?: string | null; full_name?: string | null; avatar_url?: string | null };
}
export interface Session {
  user: AuthUser;
  // legacy fields kept optional for type-compatibility; cookie mode carries no JS tokens.
  access_token?: string;
  refresh_token?: string;
}

type AuthEvent = "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED";
const listeners = new Set<(event: AuthEvent, session: Session | null) => void>();
const emit = (event: AuthEvent, session: Session | null) => listeners.forEach((cb) => cb(event, session));

// ── State (no tokens; just the public user shape + an authed flag for transport routing) ───────
let currentUser: AuthUser | null = (() => {
  try { const s = localStorage.getItem(MIRROR_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
})();
let authed = !!currentUser; // optimistic; bootstrap() reconciles against the real cookie session
const saveMirror = (u: AuthUser | null) => {
  try { if (u) localStorage.setItem(MIRROR_KEY, JSON.stringify(u)); else localStorage.removeItem(MIRROR_KEY); } catch { /* ignore */ }
};

const readCookie = (name: string): string => {
  if (typeof document === "undefined") return "";
  return document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.split("=")[1] ?? "";
};
const csrf = () => readCookie("csrf_token");

// Single-flight gateway refresh — concurrent 401s share one /auth/refresh round-trip.
let refreshing: Promise<boolean> | null = null;
function gwRefresh(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const r = await fetch(`${GATEWAY}/auth/refresh`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf() },
      });
      return r.ok;
    } catch { return false; } finally { refreshing = null; }
  })();
  return refreshing;
}

// ── Data transport ────────────────────────────────────────────────────────────
// Authenticated → gateway (/api/insiders/v1); anonymous → direct insiders-service (/v1).
// Mirrors the old apiFetch contract: returns { res, json } and parses the insiders envelope.
async function apiFetch(path: string, init: RequestInit = {}, retry = true): Promise<{ res: Response; json: any }> {
  const method = (init.method || "GET").toUpperCase();
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };

  let res: Response;
  if (authed) {
    if (method !== "GET" && method !== "HEAD") headers["x-csrf-token"] = csrf();
    res = await fetch(`${GATEWAY}${DATA_PREFIX}${path}`, { ...init, credentials: "include", headers });
    if (res.status === 401 && retry) {
      if (await gwRefresh()) return apiFetch(path, init, false);
      // session is gone → drop to anonymous (public resources still resolve; auth ones 401 below)
      setAuthed(false, null);
      res = await fetch(`${INSIDERS}${DIRECT_PREFIX}${path}`, { ...init, credentials: "omit", headers });
    }
  } else {
    res = await fetch(`${INSIDERS}${DIRECT_PREFIX}${path}`, { ...init, credentials: "omit", headers });
  }

  let json: any = null;
  try { json = await res.json(); } catch { /* no body */ }
  return { res, json };
}

// Always-gateway fetch for endpoints that require identity (whoami, owner writes during signup).
async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method || "GET").toUpperCase();
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (method !== "GET" && method !== "HEAD") headers["x-csrf-token"] = csrf();
  let res = await fetch(`${GATEWAY}${DATA_PREFIX}${path}`, { ...init, credentials: "include", headers });
  if (res.status === 401 && (await gwRefresh())) {
    res = await fetch(`${GATEWAY}${DATA_PREFIX}${path}`, { ...init, credentials: "include", headers });
  }
  return res;
}

const errFrom = (json: any) =>
  json?.error ? { message: json.error.message, code: json.error.code, details: json.error.details } : { message: "Network error" };

function setAuthed(flag: boolean, user: AuthUser | null) {
  authed = flag;
  currentUser = user;
  saveMirror(user);
}

// Resolve the canonical LOCAL identity (users.id the island keys ownership by) via /whoami.
async function syncWhoami(): Promise<AuthUser | null> {
  try {
    const res = await authedFetch("/whoami", { method: "GET" });
    if (!res.ok) { setAuthed(false, null); return null; }
    const json = await res.json();
    const d = json?.data || {};
    const u = d.user || {};
    const user: AuthUser = {
      id: String(d.userId ?? u.id ?? ""),
      email: d.email ?? u.email ?? "",
      email_verified: u.email_verified ?? true,
      roles: d.roles ?? u.roles ?? [],
      user_metadata: u.user_metadata || {},
    };
    setAuthed(true, user);
    return user;
  } catch { setAuthed(false, null); return null; }
}

// Reconcile the optimistic mirror against the real cookie session (deduped).
let booting: Promise<void> | null = null;
function bootstrap(force = false): Promise<void> {
  if (booting && !force) return booting;
  booting = (async () => {
    try {
      let r = await fetch(`${GATEWAY}/auth/me`, { credentials: "include", headers: { "Content-Type": "application/json" } });
      if (!r.ok && (await gwRefresh())) r = await fetch(`${GATEWAY}/auth/me`, { credentials: "include" });
      if (r.ok) { await syncWhoami(); }
      else { setAuthed(false, null); }
    } catch { setAuthed(false, null); }
  })();
  return booting;
}

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
    const { json } = await apiFetch("/db/query", {
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
    await bootstrap();
    return { data: { session: currentUser ? ({ user: currentUser } as Session) : null }, error: null };
  },
  async getUser() {
    await bootstrap();
    return { data: { user: currentUser }, error: null };
  },
  onAuthStateChange(cb: (event: AuthEvent, session: Session | null) => void) {
    listeners.add(cb);
    // Fire current (optimistic) state, then reconcile against the cookie session.
    Promise.resolve().then(() => cb(currentUser ? "SIGNED_IN" : "SIGNED_OUT", currentUser ? { user: currentUser } : null));
    bootstrap().then(() => cb(currentUser ? "SIGNED_IN" : "SIGNED_OUT", currentUser ? { user: currentUser } : null));
    return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
  },
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    try {
      const r = await fetch(`${GATEWAY}/auth/login`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) {
        const e: any = await r.json().catch(() => ({}));
        return { data: { user: null, session: null }, error: { message: e?.error?.message || "Invalid credentials", code: e?.error?.code } };
      }
    } catch {
      return { data: { user: null, session: null }, error: { message: "Auth gateway unreachable" } };
    }
    const user = await syncWhoami();
    if (!user) return { data: { user: null, session: null }, error: { message: "Could not resolve session" } };
    emit("SIGNED_IN", { user });
    return { data: { user, session: { user } as Session }, error: null };
  },
  async signUp({ email, password, options }: { email: string; password: string; options?: { data?: any; emailRedirectTo?: string } }) {
    const meta = options?.data || {};
    const fullName = meta.full_name || meta.username || undefined;
    try {
      const r = await fetch(`${GATEWAY}/auth/register`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName }),
      });
      if (!r.ok && r.status !== 201) {
        const e: any = await r.json().catch(() => ({}));
        return { data: { user: null, session: null }, error: { message: e?.error?.message || "Registration failed", code: e?.error?.code } };
      }
    } catch {
      return { data: { user: null, session: null }, error: { message: "Auth gateway unreachable" } };
    }
    const user = await syncWhoami();
    if (!user) return { data: { user: null, session: null }, error: { message: "Could not resolve session" } };
    // Best-effort: apply the chosen username/full_name to the JIT-provisioned insiders profile.
    if (meta.username || meta.full_name) {
      const values: Record<string, any> = {};
      if (meta.username) values.username = meta.username;
      if (meta.full_name) values.full_name = meta.full_name;
      try {
        await authedFetch("/db/query", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "profiles", action: "update", values, filters: [{ col: "id", op: "eq", val: user.id }], returning: false }),
        });
        await syncWhoami();
      } catch { /* non-fatal */ }
    }
    emit("SIGNED_IN", { user: currentUser! });
    return { data: { user: currentUser, session: currentUser ? ({ user: currentUser } as Session) : null }, error: null };
  },
  async signOut() {
    try {
      await fetch(`${GATEWAY}/auth/logout`, { method: "POST", credentials: "include", headers: { "x-csrf-token": csrf() } });
    } catch { /* cookie cleared server-side regardless */ }
    setAuthed(false, null);
    booting = Promise.resolve();
    emit("SIGNED_OUT", null);
    return { error: null };
  },
  // Password management is delegated to the central identity provider (auth-service) and is not
  // proxied by the gateway's island routes. These keep the UI honest rather than silently no-op.
  async resetPasswordForEmail(_email: string, _opts?: { redirectTo?: string }) {
    return { data: {}, error: { message: "Password reset is managed by the Baalvion identity provider." } };
  },
  async updateUser({ password: _password }: { password: string }) {
    return { data: { user: currentUser }, error: { message: "Password changes are managed by the Baalvion identity provider." } };
  },
  async resend(_opts: { type?: string; email?: string; options?: any }) {
    return { data: {}, error: null };
  },
  async resetPasswordWithToken(_token: string, _password: string) {
    return { error: { message: "Password reset is managed by the Baalvion identity provider." } };
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
        // Static uploads are served at the insiders-service root (/storage/...), reachable
        // anonymously via the direct base.
        return { data: { publicUrl: `${INSIDERS}/storage/${bucket}/${path}` } };
      },
      async createSignedUrl(path: string, _expiresIn: number) {
        return { data: { signedUrl: `${INSIDERS}/storage/${bucket}/${path}` }, error: null };
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
