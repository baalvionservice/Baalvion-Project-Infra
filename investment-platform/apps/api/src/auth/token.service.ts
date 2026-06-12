import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { CryptoService } from '../common/crypto/crypto.service';
import type {
  JwtAccessPayload,
  MfaChallengePayload,
  RequestContext,
  TokenPair,
} from './auth.types';

/**
 * Token authority.
 *  - Access tokens: stateless RS256 JWTs (15m).
 *  - Refresh tokens: opaque, high-entropy, stored hashed in `Session`.
 *    Rotated on every use within a `familyId`. Presenting an already-revoked
 *    token signals theft → the whole family is revoked (reuse detection).
 *
 * Refresh token wire format: `<sessionId>.<secret>` so we can look up by id
 * then constant-time compare the secret hash.
 */
@Injectable()
export class TokenService {
  private readonly accessTtl: number;
  private readonly refreshTtl: number;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {
    this.accessTtl = this.config.getOrThrow<number>('jwt.accessTtl');
    this.refreshTtl = this.config.getOrThrow<number>('jwt.refreshTtl');
  }

  async signAccessToken(principal: {
    userId: string;
    email: string;
    orgId: string;
    role: JwtAccessPayload['role'];
  }): Promise<string> {
    const payload: JwtAccessPayload = {
      sub: principal.userId,
      email: principal.email,
      orgId: principal.orgId,
      role: principal.role,
      type: 'access',
    };
    return this.jwt.signAsync(payload, { expiresIn: this.accessTtl });
  }

  async signMfaChallenge(userId: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, type: 'mfa_challenge' } satisfies MfaChallengePayload,
      { expiresIn: 300 }, // 5 minutes
    );
  }

  async verifyMfaChallenge(token: string): Promise<string> {
    try {
      const payload = await this.jwt.verifyAsync<MfaChallengePayload>(token);
      if (payload.type !== 'mfa_challenge') throw new Error('wrong type');
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid or expired MFA challenge');
    }
  }

  /** Create a brand-new refresh session (new family). */
  async issueRefreshToken(
    userId: string,
    ctx: RequestContext,
    familyId: string = randomUUID(),
  ): Promise<string> {
    const secret = this.crypto.randomToken(32);
    const session = await this.prisma.session.create({
      data: {
        userId,
        familyId,
        refreshTokenHash: this.crypto.sha256(secret),
        userAgent: ctx.userAgent,
        ipAddress: ctx.ipAddress,
        expiresAt: new Date(Date.now() + this.refreshTtl * 1000),
      },
    });
    return `${session.id}.${secret}`;
  }

  /** Rotate a refresh token; throws on expiry, revocation or reuse. */
  async rotateRefreshToken(
    rawToken: string,
    ctx: RequestContext,
  ): Promise<{ userId: string; refreshToken: string }> {
    const [sessionId, secret] = rawToken.split('.');
    if (!sessionId || !secret) {
      throw new UnauthorizedException('Malformed refresh token');
    }

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new UnauthorizedException('Invalid refresh token');

    // Reuse detection: a revoked token presented again ⇒ kill the family.
    if (session.revokedAt) {
      await this.prisma.session.updateMany({
        where: { familyId: session.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }
    if (!this.crypto.safeEqualHex(this.crypto.sha256(secret), session.refreshTokenHash)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotate: revoke current, mint the next within the same family.
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    const refreshToken = await this.issueRefreshToken(
      session.userId,
      ctx,
      session.familyId,
    );
    return { userId: session.userId, refreshToken };
  }

  async revokeByRawToken(rawToken: string): Promise<void> {
    const [sessionId] = rawToken.split('.');
    if (!sessionId) return;
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  buildPair(accessToken: string, refreshToken: string): TokenPair {
    return { accessToken, refreshToken, expiresIn: this.accessTtl };
  }
}
