import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
/** Restrict a route to callers holding at least one of these canonical roles (roles[]). */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
