import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { MfaService } from './mfa.service';
import type { RegisterDto } from './dto/register.dto';
import type {
  AuthenticatedUser,
  LoginResult,
  RequestContext,
  TokenPair,
} from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly mfa: MfaService,
  ) {}

  /**
   * Register a user and provision a personal investor Organization with an
   * OWNER membership. Onboarding (Phase 2) enriches/upgrades this tenant.
   */
  async register(dto: RegisterDto, ctx: RequestContext): Promise<TokenPair> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { id: true },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await this.passwords.hash(dto.password);

    const { user, membership } = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          fullName: dto.fullName,
          country: dto.country?.toUpperCase(),
          status: 'ACTIVE',
        },
      });
      const org = await tx.organization.create({
        data: {
          type: 'INVESTOR_INDIVIDUAL',
          legalName: dto.fullName,
          displayName: dto.fullName,
          country: dto.country?.toUpperCase(),
          status: 'PENDING',
        },
      });
      const membership = await tx.membership.create({
        data: { orgId: org.id, userId: user.id, role: 'OWNER' },
      });
      return { user, membership };
    });

    return this.issuePair(
      { userId: user.id, email: user.email, orgId: membership.orgId, role: 'OWNER' },
      ctx,
    );
  }

  async login(
    email: string,
    password: string,
    ctx: RequestContext,
  ): Promise<LoginResult> {
    const principal = await this.validateCredentials(email, password);

    if (await this.mfa.isEnabled(principal.userId)) {
      const challengeToken = await this.tokens.signMfaChallenge(
        principal.userId,
      );
      return { mfaRequired: true, challengeToken };
    }

    const pair = await this.issuePair(principal, ctx);
    return { mfaRequired: false, ...pair };
  }

  async completeMfaLogin(
    challengeToken: string,
    code: string,
    ctx: RequestContext,
  ): Promise<TokenPair> {
    const userId = await this.tokens.verifyMfaChallenge(challengeToken);
    const ok = await this.mfa.verify(userId, code);
    if (!ok) throw new UnauthorizedException('Invalid MFA code');

    const principal = await this.loadPrincipal(userId);
    return this.issuePair(principal, ctx);
  }

  async refresh(rawToken: string, ctx: RequestContext): Promise<TokenPair> {
    const { userId, refreshToken } = await this.tokens.rotateRefreshToken(
      rawToken,
      ctx,
    );
    const principal = await this.loadPrincipal(userId);
    const accessToken = await this.tokens.signAccessToken(principal);
    return this.tokens.buildPair(accessToken, refreshToken);
  }

  async logout(rawToken: string): Promise<void> {
    await this.tokens.revokeByRawToken(rawToken);
  }

  // ── internals ────────────────────────────────────────────────────────────

  private async validateCredentials(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    // Constant-ish work whether or not the user exists (avoid enumeration).
    const hash =
      user?.passwordHash ??
      '$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const ok = await this.passwords.verify(hash, password);
    if (!user || !ok) throw new UnauthorizedException('Invalid credentials');
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }
    return this.loadPrincipal(user.id, user.email);
  }

  /** Resolve a user's active-org principal (first membership for now). */
  private async loadPrincipal(
    userId: string,
    email?: string,
  ): Promise<AuthenticatedUser> {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
      include: email ? undefined : { user: { select: { email: true } } },
    });
    if (!membership) throw new UnauthorizedException('No active organization');
    return {
      userId,
      email: email ?? (membership as any).user.email,
      orgId: membership.orgId,
      role: membership.role,
    };
  }

  private async issuePair(
    principal: AuthenticatedUser,
    ctx: RequestContext,
  ): Promise<TokenPair> {
    const accessToken = await this.tokens.signAccessToken(principal);
    const refreshToken = await this.tokens.issueRefreshToken(
      principal.userId,
      ctx,
    );
    await this.prisma.user.update({
      where: { id: principal.userId },
      data: { lastLoginAt: new Date() },
    });
    return this.tokens.buildPair(accessToken, refreshToken);
  }
}
