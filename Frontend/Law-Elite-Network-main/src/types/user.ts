/**
 * @fileOverview Core User Type definitions for the Law Elite Network.
 */

export interface User {
  id: string;
  email: string;
  role: "client" | "lawyer" | "admin";
  name?: string;
  phone?: string;
  avatar?: string;
  createdAt?: number;
}
