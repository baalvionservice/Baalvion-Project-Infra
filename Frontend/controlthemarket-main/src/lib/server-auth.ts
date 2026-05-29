import { cookies } from 'next/headers';

/**
 * Server-component helper: the current user's id, read from the `ctm_user_id` cookie
 * the client sets at login (auth-context). Server components can't see the in-memory
 * auth state, so this cookie is how company dashboard pages scope to the logged-in user.
 * Returns null when absent (caller should fall back to the first company user for dev/demo).
 */
export async function getScopedUserId(): Promise<string | null> {
  try {
    const store = await cookies();
    return store.get('ctm_user_id')?.value || null;
  } catch {
    return null;
  }
}
