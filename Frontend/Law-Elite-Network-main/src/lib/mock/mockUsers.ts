import { User } from "@/types/user";

/**
 * @fileOverview Mock user database for localized testing and rapid prototyping.
 */

export const mockUsers = [
  {
    id: "1",
    email: "client@test.com",
    password: "password123",
    role: "client",
    name: "Jonathan Edwards",
  },
  {
    id: "2",
    email: "lawyer@test.com",
    password: "password123",
    role: "lawyer",
    name: "Harvey Specter",
  },
  {
    id: "3",
    email: "admin@test.com",
    password: "password123",
    role: "admin",
    name: "System Administrator",
  },
] as const;
