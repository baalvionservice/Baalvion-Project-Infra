/**
 * Centralized Role Definitions
 */
export type AppRole = 
  | 'public' 
  | 'p1_institutional' 
  | 'p2_spv' 
  | 'p3_operator' 
  | 'admin' 
  | 'compliance';

export const ROLES: AppRole[] = [
  'public',
  'p1_institutional',
  'p2_spv',
  'p3_operator',
  'admin',
  'compliance'
];
