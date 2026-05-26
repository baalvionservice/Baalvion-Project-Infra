"use client";

import { useCollection, useDoc, useFirestore } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { useMemo } from "react";
import { Notification, Campaign, Wallet } from "@/types";

/**
 * Streams real-time notifications for a specific user.
 */
export function useNotifications(userId: string | undefined) {
  const db = useFirestore();
  const nQuery = useMemo(() => {
    if (!userId || !db) return null;
    return query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  }, [db, userId]);

  return useCollection<Notification>(nQuery);
}

/**
 * Streams real-time updates for a specific campaign document.
 */
export function useCampaignUpdates(campaignId: string | undefined) {
  return useDoc<Campaign>(campaignId ? `campaigns/${campaignId}` : null);
}

/**
 * Streams real-time wallet balance and transaction metadata for a user.
 */
export function useWalletBalance(userId: string | undefined) {
  return useDoc<Wallet>(userId ? `wallets/wallet_${userId}` : null);
}

/**
 * Streams real-time messages for a specific conversation thread.
 */
export function useMessages(conversationId: string | undefined) {
  const db = useFirestore();
  const mQuery = useMemo(() => {
    if (!conversationId || !db) return null;
    return query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("createdAt", "asc"),
      limit(100)
    );
  }, [db, conversationId]);

  return useCollection<any>(mQuery);
}
