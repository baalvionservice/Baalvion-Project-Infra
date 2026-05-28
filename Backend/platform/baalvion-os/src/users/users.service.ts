import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/jwt.strategy';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Mirror the Keycloak identity into the local profile table (idempotent). */
  syncFromToken(u: AuthUser) {
    return this.prisma.user.upsert({
      where: { keycloakId: u.keycloakId },
      update: { email: u.email, name: u.name },
      create: {
        keycloakId: u.keycloakId,
        email: u.email ?? `${u.keycloakId}@placeholder.local`,
        name: u.name,
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
