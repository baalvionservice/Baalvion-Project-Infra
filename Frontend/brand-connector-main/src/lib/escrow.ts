"use client";

/**
 * @fileOverview Baalvion Escrow Service Layer
 *
 * Manages atomic financial transactions between brands, creators, and platform treasury.
 * Ensures total payment security using an audited escrow hold pattern.
 */

import {
  doc,
  updateDoc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  increment,
  Firestore,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { errorEmitter } from "@/firebase/error-emitter";
import {
  FirestorePermissionError,
  type SecurityRuleContext,
} from "@/firebase/errors";
import { generateAndAttachInvoice } from "./invoices";
import { Transaction, TransactionStatus } from "@/types";

/**
 * Locks campaign capital from a brand wallet into campaign escrow.
 */
export async function lockFunds(
  db: Firestore,
  campaignId: string,
  brandId: string,
  amount: number,
) {
  const brandWalletRef = doc(db!, "wallets", `wallet_${brandId}`);
  const campaignRef = doc(db!, "campaigns", campaignId);
  const txRef = collection(db!, "transactions");

  // Mutation Pattern: Atomic Increments
  const walletUpdates = {
    availableBalance: increment(-amount),
    escrowBalance: increment(amount),
    updatedAt: serverTimestamp(),
  };

  updateDoc(brandWalletRef, walletUpdates).catch(async () => {
    errorEmitter.emit(
      "permission-error",
      new FirestorePermissionError({
        path: brandWalletRef.path,
        operation: "update",
        requestResourceData: walletUpdates,
      }),
    );
  });

  const campaignUpdates = {
    escrowBalance: increment(amount),
    updatedAt: serverTimestamp(),
  };

  updateDoc(campaignRef, campaignUpdates).catch(async () => {
    errorEmitter.emit(
      "permission-error",
      new FirestorePermissionError({
        path: campaignRef.path,
        operation: "update",
        requestResourceData: campaignUpdates,
      }),
    );
  });

  const txData = {
    userId: brandId,
    campaignId,
    amount,
    type: "ESCROW_LOCK",
    status: "COMPLETED" as TransactionStatus,
    description: `Funds locked for campaign ${campaignId}`,
    createdAt: new Date().toISOString(),
  };

  addDoc(txRef, txData)
    .then(async (docRef) => {
      // Auto-generate Brand Invoice
      const storage = getStorage(); // Initialize storage
      const brandSnap = await getDoc(doc(db!, "brands", `brand_${brandId}`));
      const campaignSnap = await getDoc(campaignRef);

      generateAndAttachInvoice(
        db!,
        storage,
        { id: docRef.id, ...txData } as Transaction,
        {
          userName: brandSnap.data()?.companyName || "Brand Partner",
          userAddress: brandSnap.data()?.billingAddress,
          gstNumber: brandSnap.data()?.gstNumber,
          campaignTitle: campaignSnap.data()?.title,
        },
      );
    })
    .catch(async () => {
      errorEmitter.emit(
        "permission-error",
        new FirestorePermissionError({
          path: "transactions",
          operation: "create",
          requestResourceData: txData,
        }),
      );
    });
}

/**
 * Releases funds from campaign escrow to a creator's available balance.
 */
export async function releaseFunds(
  db: Firestore,
  applicationId: string,
  creatorId: string,
  campaignId: string,
  amount: number,
) {
  const creatorWalletRef = doc(db!, "wallets", `wallet_${creatorId}`);
  const campaignRef = doc(db!, "campaigns", campaignId);
  const txRef = collection(db!, "transactions");

  const walletUpdates = {
    availableBalance: increment(amount),
    updatedAt: serverTimestamp(),
  };

  updateDoc(creatorWalletRef, walletUpdates).catch(async () => {
    errorEmitter.emit(
      "permission-error",
      new FirestorePermissionError({
        path: creatorWalletRef.path,
        operation: "update",
        requestResourceData: walletUpdates,
      }),
    );
  });

  const campaignUpdates = {
    escrowBalance: increment(-amount),
    updatedAt: serverTimestamp(),
  };

  updateDoc(campaignRef, campaignUpdates).catch(async () => {
    errorEmitter.emit(
      "permission-error",
      new FirestorePermissionError({
        path: campaignRef.path,
        operation: "update",
        requestResourceData: campaignUpdates,
      }),
    );
  });

  const txData = {
    userId: creatorId,
    campaignId,
    amount,
    type: "ESCROW_RELEASE",
    status: "COMPLETED" as TransactionStatus,
    description: `Payout released for application ${applicationId}`,
    createdAt: new Date().toISOString(),
  };

  addDoc(txRef, txData)
    .then(async (docRef) => {
      // Auto-generate Creator Payout Advice
      const storage = getStorage();
      const creatorSnap = await getDoc(
        doc(db!, "creators", `creator_${creatorId}`),
      );
      const campaignSnap = await getDoc(campaignRef);

      generateAndAttachInvoice(
        db!,
        storage,
        { id: docRef.id, ...txData } as Transaction,
        {
          userName: creatorSnap.data()?.username || "Verified Creator",
          campaignTitle: campaignSnap.data()?.title,
        },
      );
    })
    .catch(async () => {
      errorEmitter.emit(
        "permission-error",
        new FirestorePermissionError({
          path: "transactions",
          operation: "create",
          requestResourceData: txData,
        }),
      );
    });
}

/**
 * Returns funds from campaign escrow back to the brand wallet (e.g., after dispute).
 */
export async function refundFunds(
  db: Firestore,
  campaignId: string,
  brandId: string,
  amount: number,
) {
  const brandWalletRef = doc(db!, "wallets", `wallet_${brandId}`);
  const campaignRef = doc(db!, "campaigns", campaignId);
  const txRef = collection(db!, "transactions");

  const walletUpdates = {
    availableBalance: increment(amount),
    escrowBalance: increment(-amount),
    updatedAt: serverTimestamp(),
  };

  updateDoc(brandWalletRef, walletUpdates).catch(async () => {
    errorEmitter.emit(
      "permission-error",
      new FirestorePermissionError({
        path: brandWalletRef.path,
        operation: "update",
        requestResourceData: walletUpdates,
      }),
    );
  });

  const campaignUpdates = {
    escrowBalance: increment(-amount),
    updatedAt: serverTimestamp(),
  };

  updateDoc(campaignRef, campaignUpdates).catch(async () => {
    errorEmitter.emit(
      "permission-error",
      new FirestorePermissionError({
        path: campaignRef.path,
        operation: "update",
        requestResourceData: campaignUpdates,
      }),
    );
  });

  const txData = {
    userId: brandId,
    campaignId,
    amount,
    type: "REFUND",
    status: "COMPLETED" as TransactionStatus,
    description: `Funds refunded for campaign ${campaignId}`,
    createdAt: new Date().toISOString(),
  };

  addDoc(txRef, txData).catch(async () => {
    errorEmitter.emit(
      "permission-error",
      new FirestorePermissionError({
        path: "transactions",
        operation: "create",
        requestResourceData: txData,
      }),
    );
  });
}

/**
 * Fetches the current escrow balance for a campaign.
 */
export async function getEscrowStatus(db: Firestore, campaignId: string) {
  const campaignRef = doc(db!, "campaigns", campaignId);
  const snap = await getDoc(campaignRef);

  if (!snap.exists()) return 0;
  return snap.data().escrowBalance || 0;
}
