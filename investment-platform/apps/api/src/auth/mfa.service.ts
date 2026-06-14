import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { PrismaService } from '../common/prisma/prisma.service';
import { CryptoService } from '../common/crypto/crypto.service';

export interface MfaEnrollment {
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

/**
 * TOTP-based MFA. Secrets are stored encrypted (AES-256-GCM) and only marked
 * `confirmedAt` once the user proves possession with a valid code.
 */
@Injectable()
export class MfaService {
  private readonly issuer: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    config: ConfigService,
  ) {
    this.issuer = config.getOrThrow<string>('mfa.issuer');
  }

  async isEnabled(userId: string): Promise<boolean> {
    const cred = await this.prisma.mfaCredential.findFirst({
      where: { userId, method: 'TOTP', confirmedAt: { not: null } },
      select: { id: true },
    });
    return !!cred;
  }

  /** Begin (or restart) TOTP enrollment; returns provisioning URI + QR. */
  async enroll(userId: string, email: string): Promise<MfaEnrollment> {
    const secret = authenticator.generateSecret();
    await this.prisma.mfaCredential.upsert({
      where: { userId_method: { userId, method: 'TOTP' } },
      create: {
        userId,
        method: 'TOTP',
        secret: this.crypto.encrypt(secret),
      },
      update: {
        secret: this.crypto.encrypt(secret),
        confirmedAt: null,
        backupCodes: [],
      },
    });

    const otpauthUrl = authenticator.keyuri(email, this.issuer, secret);
    return { otpauthUrl, qrCodeDataUrl: await toDataURL(otpauthUrl) };
  }

  /** Confirm enrollment; on success returns one-time backup codes. */
  async confirm(userId: string, code: string): Promise<string[]> {
    const cred = await this.prisma.mfaCredential.findUnique({
      where: { userId_method: { userId, method: 'TOTP' } },
    });
    if (!cred) throw new BadRequestException('No pending MFA enrollment');

    const secret = this.crypto.decrypt(cred.secret);
    if (!authenticator.check(code, secret)) {
      throw new BadRequestException('Invalid TOTP code');
    }

    const plainCodes = Array.from({ length: 10 }, () =>
      this.crypto.randomToken(6),
    );
    await this.prisma.mfaCredential.update({
      where: { id: cred.id },
      data: {
        confirmedAt: new Date(),
        backupCodes: plainCodes.map((c) => this.crypto.sha256(c)),
      },
    });
    return plainCodes;
  }

  /** Verify a login-time TOTP code or single-use backup code. */
  async verify(userId: string, code: string): Promise<boolean> {
    const cred = await this.prisma.mfaCredential.findFirst({
      where: { userId, method: 'TOTP', confirmedAt: { not: null } },
    });
    if (!cred) return false;

    const secret = this.crypto.decrypt(cred.secret);
    if (authenticator.check(code, secret)) return true;

    // Backup code path — consume on use.
    const hashed = this.crypto.sha256(code);
    if (cred.backupCodes.includes(hashed)) {
      await this.prisma.mfaCredential.update({
        where: { id: cred.id },
        data: { backupCodes: cred.backupCodes.filter((c) => c !== hashed) },
      });
      return true;
    }
    return false;
  }
}
