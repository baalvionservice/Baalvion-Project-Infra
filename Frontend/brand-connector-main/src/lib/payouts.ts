"use client";

/**
 * @fileOverview Baalvion Payout Engine
 *
 * Manages the withdrawal lifecycle for creators, including balance validation,
 * transaction logging, and settlement simulation.
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

interface PayoutRequest {
  creatorId: string;
  amount: number;
  method: "upi" | "bank" | "payoneer";
  target: string;
}

/**
 * Initiates a withdrawal request.
 * Debits available balance and creates a PENDING transaction.
 */
export async function requestPayout(db: Firestore, request: PayoutRequest) {
  const { creatorId, amount, method, target } = request;
  const walletId = `wallet_${creatorId}`;
  const walletRef = doc(db!, "wallets", walletId);
  const txRef = collection(db!, "transactions");

  // 1. Atomic Wallet Update
  const walletUpdates = {
    availableBalance: increment(-amount),
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(walletRef, walletUpdates);
  } catch (err) {
    errorEmitter.emit(
      "permission-error",
      new FirestorePermissionError({
        path: walletRef.path,
        operation: "update",
        requestResourceData: walletUpdates,
      }),
    );
    throw err;
  }

  // 2. Create Transaction Record
  const txData = {
    userId: creatorId,
    walletId,
    amount,
    type: "PAYOUT",
    status: "PENDING" as TransactionStatus,
    description: `Withdrawal via ${method.toUpperCase()}`,
    payoutMethod: {
      type: method,
      target: target,
    },
    createdAt: new Date().toISOString(),
  };

  const docRef = await addDoc(txRef, txData);

  // 3. Send Initial Notification
  await addDoc(collection(db!, "notifications"), {
    userId: creatorId,
    title: "Payout Initiated 💸",
    message: `Your withdrawal of ₹${amount.toLocaleString()} is now being processed via ${method.toUpperCase()}.`,
    type: "PAYMENT",
    read: false,
    createdAt: new Date().toISOString(),
  });

  // 4. Simulate Processing
  // UPI is mocked as near-instant, Bank takes "time"
  const delay = method === "upi" ? 5000 : 15000;

  setTimeout(() => {
    processPayout(db!, docRef.id);
  }, delay);

  return docRef.id;
}

/**
 * Finalizes a payout, updates status, and generates receipt.
 */
export async function processPayout(db: Firestore, payoutId: string) {
  const txRef = doc(db!, "transactions", payoutId);
  const txSnap = await getDoc(txRef);

  if (!txSnap.exists()) return;
  const tx = { id: txSnap.id, ...txSnap.data() } as Transaction;

  const updateData = {
    status: "COMPLETED" as TransactionStatus,
    settledAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await updateDoc(txRef, updateData);

    // Generate Official Payout Advice
    const storage = getStorage();
    const creatorSnap = await getDoc(
      doc(db!, "creators", `creator_${tx.userId}`),
    );

    await generateAndAttachInvoice(
      db!,
      storage,
      { ...tx, ...updateData },
      {
        userName: creatorSnap.data()?.username || "Verified Creator",
      },
    );

    // Notify Success
    await addDoc(collection(db!, "notifications"), {
      userId: tx.userId,
      title: "Funds Transferred! ✅",
      message: `₹${tx.amount.toLocaleString()} has been successfully transferred to your ${tx.type.toUpperCase()} account.`,
      type: "PAYMENT",
      read: false,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Payout Processing Failed:", err);
  }
}

/**
 * Helper to determine visual progress for the UI tracker
 */
export function getPayoutStep(
  status: TransactionStatus,
  method: string,
): number {
  if (status === "COMPLETED") return 4;
  if (status === "FAILED") return 0;
  if (status === "PENDING") {
    return method === "upi" ? 2 : 1;
  }
  return 1;
}
