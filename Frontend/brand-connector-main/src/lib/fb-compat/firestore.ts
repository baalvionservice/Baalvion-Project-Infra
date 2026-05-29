/**
 * Firestore-compatible shim, REST-backed by Baalvion OS.
 *
 * Reimplements the subset of `firebase/firestore` the app uses so existing
 * call sites work unchanged while data flows through the NestJS backend.
 * `firebase/firestore` imports are redirected here (see import rewrite).
 *
 * Notes:
 *  - where/orderBy/limit are accepted but not enforced server-side (the
 *    simple REST endpoints return the collection; filter client-side if needed).
 *  - reads never throw — they resolve to empty so pages render during migration.
 */
import baalvion from '@/lib/baalvion';

export type Firestore = any;
export type Query = any;
export type DocumentReference = any;
export type CollectionReference = any;
export type DocumentData = any;
export class FirestoreError extends Error {}
export class Timestamp {
  constructor(public seconds: number, public nanoseconds = 0) {}
  static now() { return new Timestamp(Math.floor(Date.now() / 1000)); }
  toDate() { return new Date(this.seconds * 1000); }
}

// Map Firestore collection names → Baalvion REST resources where they differ.
const ALIASES: Record<string, string> = {
  audit_logs: 'system-logs',
  auditLogs: 'system-logs',
  portfolioItems: 'portfolio',
};
const endpoint = (path: string) => '/' + (ALIASES[path] ?? path);
const pathOf = (ref: any) => ref?.path;

export function getFirestore(_app?: any): Firestore {
  return { __db: true };
}

// Variadic: collection(db, 'a') or subcollection collection(db, 'a', 'id', 'b').
export function collection(_db: any, ...segments: string[]): CollectionReference {
  return { __k: 'collection', path: segments.join('/') };
}

// Variadic: doc(collectionRef, id) | doc(db, 'seg', 'seg', ..., id) — last string segment is the id.
export function doc(a: any, ...rest: string[]): DocumentReference {
  const segs: string[] = (a && a.__k === 'collection' ? [a.path, ...rest] : rest)
    .filter((s) => typeof s === 'string')
    .flatMap((s) => s.split('/'));
  const id = segs.pop();
  return { __k: 'doc', path: segs.join('/'), id };
}

export function query(ref: any, ...constraints: any[]): Query {
  return { __k: 'query', path: ref?.path, constraints };
}
export const where = (field: string, op: string, value: any) => ({ __c: 'where', field, op, value });
export const orderBy = (field: string, dir = 'asc') => ({ __c: 'orderBy', field, dir });
export const limit = (n: number) => ({ __c: 'limit', n });
export const startAfter = (..._a: any[]) => ({ __c: 'startAfter' });
export const serverTimestamp = () => new Date().toISOString();

// Field-value helpers (server applies semantics; client just carries the intent).
export const arrayUnion = (...items: any[]) => ({ __op: 'arrayUnion', items });
export const arrayRemove = (...items: any[]) => ({ __op: 'arrayRemove', items });
export const increment = (n = 1) => ({ __op: 'increment', n });
export const deleteField = () => ({ __op: 'deleteField' });
export type WithFieldValue<T> = T;
export type FieldValue = any;
// Loose snapshot shape so call-site callbacks (snap.docs.map(doc => …), snap.data()) type cleanly.
export interface Snapshot {
  docs: any[];
  empty: boolean;
  size: number;
  forEach: (cb: (d: any) => void) => void;
  data: () => any;
  exists: () => boolean;
  id: string;
  get: (field: string) => any;
  metadata?: any;
}
export type QuerySnapshot = Snapshot;
export type DocumentSnapshot = Snapshot;
export type QueryDocumentSnapshot = Snapshot;

function toSnapshot(items: any[]) {
  const docs = items.map((it: any) => ({
    id: it?.id,
    data: () => it,
    exists: () => true,
    get: (f: string) => it?.[f],
  }));
  return { docs, empty: docs.length === 0, size: docs.length, forEach: (cb: any) => docs.forEach(cb) };
}

async function fetchList(ref: any): Promise<any[]> {
  try {
    const { data } = await baalvion.get(endpoint(pathOf(ref)));
    const items = data?.data ?? data ?? [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export async function getDocs(ref: any) {
  return toSnapshot(await fetchList(ref));
}

export async function getDoc(ref: any) {
  try {
    const { data } = await baalvion.get(`${endpoint(ref.path)}/${ref.id}`);
    const it = data?.data ?? data;
    return { id: ref.id, exists: () => !!it, data: () => it, get: (f: string) => it?.[f] };
  } catch {
    return { id: ref.id, exists: () => false, data: () => undefined, get: () => undefined };
  }
}

export async function addDoc(ref: any, payload: any) {
  const { data } = await baalvion.post(endpoint(ref.path), payload);
  const it = data?.data ?? data;
  return { id: it?.id, path: `${ref.path}/${it?.id}` };
}

export async function setDoc(ref: any, payload: any, _opts?: any) {
  if (ref.id) await baalvion.patch(`${endpoint(ref.path)}/${ref.id}`, payload);
  else await baalvion.post(endpoint(ref.path), payload);
}

export async function updateDoc(ref: any, payload: any, _opts?: any) {
  await baalvion.patch(`${endpoint(ref.path)}/${ref.id}`, payload);
}

export async function deleteDoc(ref: any) {
  await baalvion.delete(`${endpoint(ref.path)}/${ref.id}`);
}

/**
 * Polling replacement for realtime listeners (the WS gateway is the future path).
 * Accepts the firebase overloads: (ref, onNext, onError?, onComplete?) and
 * (ref, options, onNext, onError?, onComplete?). The first function arg is treated as onNext.
 */
export function onSnapshot(
  ref: any,
  a2?: (snap: Snapshot) => void,
  a3?: (err: any) => void,
  _a4?: (snap: Snapshot) => void,
  _a5?: (err: any) => void,
) {
  const onNext = ([a2, a3, _a4, _a5].find((x) => typeof x === 'function') ?? (() => {})) as (snap: Snapshot) => void;
  let active = true;
  const isDoc = ref?.__k === 'doc';
  const tick = async () => {
    if (!active) return;
    try {
      const snap: any = isDoc ? await getDoc(ref) : toSnapshot(await fetchList(ref));
      if (active) onNext(snap as Snapshot);
    } catch {
      /* swallow — keep UI alive */
    }
  };
  tick();
  const timer = setInterval(tick, 5000);
  return () => {
    active = false;
    clearInterval(timer);
  };
}

export function writeBatch(_db?: any) {
  const ops: Array<() => Promise<any>> = [];
  return {
    set: (ref: any, data: any) => ops.push(() => setDoc(ref, data)),
    update: (ref: any, data: any) => ops.push(() => updateDoc(ref, data)),
    delete: (ref: any) => ops.push(() => deleteDoc(ref)),
    commit: async () => {
      for (const op of ops) await op();
    },
  };
}
