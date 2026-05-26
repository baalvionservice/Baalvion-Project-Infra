"use client";

/**
 * @fileOverview Baalvion Centralized Notification Service
 *
 * Manages the dispatch and lifecycle of in-app alerts for brands and creators.
 */

import {
  collection,
  addDoc,
  Firestore,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { NotificationType, Notification } from "@/types";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

/**
 * Creates a new notification in Firestore.
 */
export async function createNotification(
  db: Firestore,
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
  relatedId?: string,
) {
  // 30 day expiration date for cleanup logic
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const notificationData = {
    userId,
    type,
    title,
    message,
    read: false,
    link: link || null,
    relatedId: relatedId || null,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  try {
    const docRef = await addDoc(
      collection(db!, "notifications"),
      notificationData,
    );
    return docRef.id;
  } catch (err: any) {
    errorEmitter.emit(
      "permission-error",
      new FirestorePermissionError({
        path: "/notifications",
        operation: "create",
        requestResourceData: notificationData,
      }),
    );
    return null;
  }
}

/**
 * Marks a notification as read.
 */
export async function markNotificationAsRead(
  db: Firestore,
  notificationId: string,
) {
  const ref = doc(db!, "notifications", notificationId);

  try {
    await updateDoc(ref, { read: true });
  } catch (err: any) {
    errorEmitter.emit(
      "permission-error",
      new FirestorePermissionError({
        path: ref.path,
        operation: "update",
        requestResourceData: { read: true },
      }),
    );
  }
}

/**
 * Permanently deletes a notification.
 */
export async function deleteNotification(
  db: Firestore,
  notificationId: string,
) {
  const ref = doc(db!, "notifications", notificationId);

  try {
    await deleteDoc(ref);
  } catch (err: any) {
    errorEmitter.emit(
      "permission-error",
      new FirestorePermissionError({
        path: ref.path,
        operation: "delete",
      }),
    );
  }
}
