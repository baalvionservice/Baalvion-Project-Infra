'use client';

function requireFirebaseEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.startsWith('AIzaSyDummy') || value === 'baalvion-mock') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `[brand-connector] Firebase env var ${key} is missing or contains a mock value. ` +
          'Set real Firebase credentials in .env.local before deploying.',
      );
    }
    console.warn(
      `[brand-connector] WARNING: ${key} not set or is mock. Firebase auth will not work.`,
    );
  }
  return value ?? '';
}

export const firebaseConfig = {
  apiKey: requireFirebaseEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
};
