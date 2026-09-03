import { UserRole } from '@/lib/access/access.types';

export type Role = UserRole;

export interface User {
    id: string;
    name: string;
    fullName?: string;
    email: string;
    phone?: string;
    role: Role;
    avatarUrl?: string;
    createdAt?: string; // Added for user management table
    // Portal identity, resolved by jobs-service from the signed-in email. `id` above is
    // the auth user id and is NOT interchangeable with these.
    candidateId?: string | null;
    /** Candidate ID shown on the dashboard and quoted in every email (BAAL-C-YYYY-NNNNNN). */
    referenceCode?: string | null;
    /** Employee ID — issued only once an application reaches `hired`. */
    employeeCode?: string | null;
}
