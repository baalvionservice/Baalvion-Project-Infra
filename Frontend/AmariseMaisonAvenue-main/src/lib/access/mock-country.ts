/**
 * @fileOverview Utility to simulate country switching for mock session testing.
 */

import { MaisonUser } from "@/lib/rbac/mock-users";

export function simulateCountrySwitch(user: MaisonUser, newCountry: string) {
  if (user.role === 'super_admin') {
    console.warn("Super Admin geography is always GLOBAL. Logic override ignored.");
    return;
  }
  
  user.country = newCountry;
  console.log(`%c[DEV] User country switched to: ${newCountry}`, "color: #7E3F98; font-weight: bold;");
}
