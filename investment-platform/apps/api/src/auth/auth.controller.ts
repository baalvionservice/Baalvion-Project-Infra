import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { MfaService } from './mfa.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MfaLoginDto, MfaCodeDto } from './dto/mfa.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser, RequestContext, TokenPair } from './auth.types';

const REFRESH_COOKIE = 'baalvion_refresh';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly mfa: MfaService,
    private readonly config: ConfigService,
  ) {}

  // ── Public auth flows ──────────────────────────────────────────────────────

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const pair = await this.auth.register(dto, this.ctx(req));
    return this.respondWithTokens(res, pair);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(dto.email, dto.password, this.ctx(req));
    if (result.mfaRequired) {
      return { success: true, mfaRequired: true, challengeToken: result.challengeToken };
    }
    return this.respondWithTokens(res, result);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('mfa/verify')
  async verifyMfaLogin(
    @Body() dto: MfaLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const pair = await this.auth.completeMfaLogin(
      dto.challengeToken,
      dto.code,
      this.ctx(req),
    );
    return this.respondWithTokens(res, pair);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = dto.refreshToken ?? req.cookies?.[REFRESH_COOKIE];
    if (!token) throw new UnauthorizedException('Missing refresh token');
    const pair = await this.auth.refresh(token, this.ctx(req));
    return this.respondWithTokens(res, pair);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = dto.refreshToken ?? req.cookies?.[REFRESH_COOKIE];
    if (token) await this.auth.logout(token);
    res.clearCookie(REFRESH_COOKIE);
    return { success: true };
  }

  // ── Authenticated MFA management ───────────────────────────────────────────

  @Post('mfa/enroll')
  async enrollMfa(@CurrentUser() user: AuthenticatedUser) {
    const enrollment = await this.mfa.enroll(user.userId, user.email);
    return { success: true, ...enrollment };
  }

  @HttpCode(HttpStatus.OK)
  @Post('mfa/confirm')
  async confirmMfa(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MfaCodeDto,
  ) {
    const backupCodes = await this.mfa.confirm(user.userId, dto.code);
    return { success: true, backupCodes };
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return { success: true, user };
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  private ctx(req: Request): RequestContext {
    return {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    };
  }

  private respondWithTokens(res: Response, pair: TokenPair) {
    res.cookie(REFRESH_COOKIE, pair.refreshToken, {
      httpOnly: true,
      secure: this.config.get('nodeEnv') === 'production',
      sameSite: 'lax',
      maxAge: this.config.getOrThrow<number>('jwt.refreshTtl') * 1000,
      path: '/api/v1/auth',
    });
    // The refresh token is delivered only via the httpOnly, secure cookie above
    // and is deliberately NOT returned in the JSON body, so client-side script
    // (and any client storage it writes to) never sees this sensitive credential.
    return {
      success: true,
      accessToken: pair.accessToken,
      expiresIn: pair.expiresIn,
    };
  }
}
