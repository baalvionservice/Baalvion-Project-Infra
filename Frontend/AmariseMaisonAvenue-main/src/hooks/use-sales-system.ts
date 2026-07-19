'use client';

import { useCallback, useEffect, useState } from 'react';
import { PrivateInquiry, LeadConversation } from '@/lib/types';
import {
  createInquiry as apiCreateInquiry,
  getMyInquiry,
  addInquiryMessage,
  toConversation,
} from '@/lib/crm-client';

// Guest inquiries have no login session, so ownership is proven the same way the guest cart
// is (see api-client.ts's `amarise.cartSession`): the email used to raise the inquiry is
// remembered locally, keyed by inquiry id, and sent back on every read/write. This is what
// lets the customer reopen /inquiry/[id] after the initial redirect without an account.
const STORAGE_KEY = 'amarise.myInquiries';

function rememberInquiryEmail(id: string, email: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[id] = email;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function recallInquiryEmail(id: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return typeof map[id] === 'string' ? map[id] : null;
  } catch {
    return null;
  }
}

/** Every {id, email} pair this browser has raised an inquiry under (most recent first). */
function listRememberedInquiries(): { id: string; email: string }[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const map = JSON.parse(raw) as Record<string, string>;
    return Object.entries(map)
      .reverse()
      .map(([id, email]) => ({ id, email }));
  } catch {
    return [];
  }
}

/**
 * Real, backend-persisted private sales inquiries (crm-service `Inquiry` entity) — replaces
 * the previous purely client-side mock simulation (shared global array + a fake instant
 * "curator" auto-reply). There is no auto-reply anymore: a new inquiry sits in `new` status
 * until an actual person responds via crm-service; this hook only ever reflects real state.
 */
export function useSalesSystem() {
  const createInitialInquiry = useCallback(
    async (
      data: Omit<PrivateInquiry, 'id' | 'status' | 'leadTier' | 'timestamp' | 'messages'>
    ): Promise<string | null> => {
      const created = await apiCreateInquiry(data);
      if (!created) return null;
      if (data.email) rememberInquiryEmail(created.id, data.email);
      return created.id;
    },
    []
  );

  const sendMessage = useCallback(
    async (inquiryId: string, text: string): Promise<PrivateInquiry | null> => {
      return addInquiryMessage(inquiryId, 'client', text);
    },
    []
  );

  return { createInitialInquiry, sendMessage, recallInquiryEmail };
}

/**
 * Loads (and polls) a single inquiry + its conversation thread by id, scoped to the email it
 * was raised under. Used by CuratorChat / the inquiry detail page — replaces the old
 * synchronous store lookup with a real, ownership-checked fetch.
 */
export function useInquiryThread(inquiryId: string, email: string | null) {
  const [inquiry, setInquiry] = useState<PrivateInquiry | null>(null);
  const [conversation, setConversation] = useState<LeadConversation | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!inquiryId || !email) {
      setLoading(false);
      return;
    }
    const row = await getMyInquiry(inquiryId, email);
    setInquiry(row);
    setConversation(row ? toConversation(row) : null);
    setLoading(false);
  }, [inquiryId, email]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const sendClientMessage = useCallback(
    async (text: string) => {
      const updated = await addInquiryMessage(inquiryId, 'client', text);
      if (updated) {
        setInquiry(updated);
        setConversation(toConversation(updated));
      }
    },
    [inquiryId]
  );

  return { inquiry, conversation, loading, sendClientMessage, refresh };
}

/**
 * Every inquiry THIS BROWSER has raised (via the remembered id/email pairs), fetched in
 * parallel and ownership-checked exactly like useInquiryThread. Replaces the old global
 * `privateInquiries` store array, which showed every visitor the same shared seed data
 * regardless of who they were.
 */
export function useMyInquiries() {
  const [inquiries, setInquiries] = useState<PrivateInquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const remembered = listRememberedInquiries();
    if (remembered.length === 0) {
      setInquiries([]);
      setLoading(false);
      return;
    }
    Promise.all(remembered.map(({ id, email }) => getMyInquiry(id, email))).then((rows) => {
      if (!active) return;
      setInquiries(rows.filter((r): r is PrivateInquiry => r !== null));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { inquiries, loading };
}
