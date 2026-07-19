import type { Role } from "../roles/system";

/**
 * An internal staff/VIP persona (curator, ops, etc.), as distinct from a real
 * customer identity (see useAuth()). store.tsx's `currentUser` defaults to
 * `null` for every anonymous visitor — nothing should assume a signed-in staff
 * persona unless something explicitly authenticates and sets one.
 */
export interface MaisonUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  country: string; // 'global' or lowercase country code ('us', 'uk', 'ae', 'in', 'sg')
}
