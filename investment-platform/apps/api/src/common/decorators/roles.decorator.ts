import { SetMetadata } from '@nestjs/common';
import type { MembershipRole } from '@baalvion-invest/database';

export const ROLES_KEY = 'roles';

/** Restricts a route to the given membership roles within the active org. */
export const Roles = (...roles: MembershipRole[]) =>
  SetMetadata(ROLES_KEY, roles);
