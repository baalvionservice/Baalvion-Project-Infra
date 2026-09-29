/** firebase/app-compatible shim — no real Firebase app is initialized. */
export type FirebaseApp = { name: string; options: Record<string, any> };
export type FirebaseOptions = Record<string, any>;

const DEFAULT_APP: FirebaseApp = { name: '[DEFAULT]', options: {} };

export function initializeApp(options: FirebaseOptions = {}): FirebaseApp {
  return { name: '[DEFAULT]', options };
}
export function getApps(): FirebaseApp[] {
  return [];
}
export function getApp(_name?: string): FirebaseApp {
  return DEFAULT_APP;
}
