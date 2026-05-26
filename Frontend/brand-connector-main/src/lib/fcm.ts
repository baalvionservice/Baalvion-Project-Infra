'use client';

/**
 * @fileOverview Baalvion Firebase Cloud Messaging (FCM) Service
 * 
 * Manages push notification permissions, registration tokens,
 * and foreground message handling.
 */

import { getToken, onMessage, Messaging } from 'firebase/messaging';
import { initializeFirebase } from '@/firebase';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "YOUR_PUBLIC_VAPID_KEY";

/**
 * Requests browser permission for notifications.
 */
export async function requestPermission() {
  if (typeof window === 'undefined') return false;
  
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    console.log('Notification permission granted.');
    return true;
  }
  console.log('Notification permission denied.');
  return false;
}

/**
 * Retrieves the FCM registration token for the current device.
 */
export async function getFcmToken() {
  const { messaging } = initializeFirebase();
  if (!messaging) return null;

  try {
    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    });
    if (currentToken) {
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
    return null;
  }
}

/**
 * Listens for messages when the app is in the foreground.
 */
export const onMessageListener = () => {
  const { messaging } = initializeFirebase();
  if (!messaging) return Promise.resolve(null);

  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Trigger a native browser notification if desired
      if (payload.notification) {
        new Notification(payload.notification.title || 'Baalvion Alert', {
          body: payload.notification.body,
          icon: '/logo.png'
        });
      }
      
      resolve(payload);
    });
  });
};
