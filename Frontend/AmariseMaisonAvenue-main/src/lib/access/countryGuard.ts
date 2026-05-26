import { MaisonUser } from "@/lib/rbac/mock-users";

/**
 * @fileOverview Guard for checking geographic jurisdiction.
 */

export function isCountryAllowed(user: MaisonUser | null, resourceCountry: string): boolean {
  if (!user) return false;
  
  // Super Admins and Global Operators have absolute jurisdiction
  if (user.role === "super_admin") return true;
  if (user.country === "GLOBAL") return true;
  
  // Regional users are strictly isolated to their country code
  return user.country.toLowerCase() === resourceCountry.toLowerCase();
}
