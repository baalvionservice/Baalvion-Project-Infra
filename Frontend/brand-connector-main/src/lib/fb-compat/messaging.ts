/** firebase/messaging-compatible shim — push is not wired post-Firebase (no-ops). */
export type Messaging = any;

export function getMessaging(_app?: any): Messaging {
  return { __messaging: true };
}
export async function isSupported(): Promise<boolean> {
  return false;
}
export async function getToken(_messaging?: any, _opts?: any): Promise<string | null> {
  return null;
}
export function onMessage(_messaging: any, _next: any) {
  return () => {};
}
