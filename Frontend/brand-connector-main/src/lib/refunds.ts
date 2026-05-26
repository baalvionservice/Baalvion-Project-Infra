"use client";

/**
 * @fileOverview Baalvion Automated Refund Flow
 *
 * Manages the reversal of campaign capital from escrow back to the brand wallet.
 * Triggers include dispute resolutions, cancellations, and performance failures.
 */

import {
  doc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  increment,
  Firestore,
  getDoc,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { generateAndAttachInvoice } from "./invoices";
import { Transaction, TransactionStatus } from "@/types";

export type RefundReason =
  | "DISPUTE_WON"
  | "CAMPAIGN_CANCELLED"
  | "CREATOR_FAILURE";

interface RefundParams {
  campaignId: string;
  brandId: string;
  creatorId?: string;
  amount: number;
  reasonType: RefundReason;
}

/**
 * Processes a full refund of campaign capital.
 * Debits campaign escrow and credits brand available balance.
 */
export async function processRefund(db: Firestore, params: RefundParams) {
  const { campaignId, brandId, creatorId, amount, reasonType } = params;

  // 1. References
  const brandWalletId = `wallet_${brandId}`;
  const brandWalletRef = doc(db!, "wallets", brandWalletId);
  const campaignRef = doc(db!, "campaigns", campaignId);
  const txRef = collection(db!, "transactions");

  // 2. Atomic Balance Updates
  const walletUpdates = {
    availableBalance: increment(amount),
    escrowBalance: increment(-amount),
    updatedAt: serverTimestamp(),
  };

  const campaignUpdates = {
    escrowBalance: increment(-amount),
    updatedAt: serverTimestamp(),
  };

  try {
    // Execute updates
    await updateDoc(brandWalletRef, walletUpdates);
    await updateDoc(campaignRef, campaignUpdates);

    // 3. Create Transaction Record
    const txData = {
      userId: brandId,
      walletId: brandWalletId,
      campaignId,
      amount,
      type: "REFUND",
      status: "COMPLETED" as TransactionStatus,
      description: `Refund for campaign ${campaignId} due to ${reasonType.replace("_", " ")}`,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(txRef, txData);

    // 4. Generate Official Refund Statement
    const storage = getStorage();
    const brandSnap = await getDoc(doc(db!, "brands", `brand_${brandId}`));
    const campaignSnap = await getDoc(campaignRef);

    await generateAndAttachInvoice(
      db!,
      storage,
      { id: docRef.id, ...txData } as Transaction,
      {
        userName: brandSnap.data()?.companyName || "Brand Partner",
        campaignTitle: campaignSnap.data()?.title,
      },
    );

    // 5. Notify Brand
    await addDoc(collection(db!, "notifications"), {
      userId: brandId,
      title: "Refund Processed 💰",
      message: `₹${amount.toLocaleString()} has been returned to your available balance.`,
      type: "PAYMENT",
      read: false,
      createdAt: new Date().toISOString(),
      link: "/dashboard/brand/wallet",
    });

    // 6. Notify Creator (if applicable)
    if (creatorId) {
      await addDoc(collection(db!, "notifications"), {
        userId: creatorId,
        title: "Escrow Update",
        message: `The escrow for project "${campaignSnap.data()?.title || "Active Campaign"}" has been refunded to the brand.`,
        type: "SYSTEM",
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    return docRef.id;
  } catch (err: any) {
    errorEmitter.emitPermissionError(
      new FirestorePermissionError({
        path: brandWalletRef.path,
        operation: "update",
        requestResourceData: walletUpdates,
      }),
    );
    throw err;
  }
}

/**
 * Helper to determine visual progress for the UI tracker
 */
export function getRefundStep(status: TransactionStatus): number {
  if (status === "COMPLETED") return 4;
  if (status === "FAILED") return 0;
  if (status === "PENDING") return 2;
  return 1;
}
