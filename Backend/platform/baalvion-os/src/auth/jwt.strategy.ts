import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

export interface AuthUser {
  userId: string;            // canonical `sub`
  keycloakId: string;        // DEPRECATED alias = userId; kept until the users.keycloakId column is renamed
  email: string;
  name?: string;
  orgId?: string;            // canonical `org_id`
  sessionId?: string;        // canonical `sid`
  roles: string[];           // canonical roles[] (may carry app roles: recruiter/brand/creator/admin/…)
  raw: Record<string, any>;
}

// auth-service is the SOLE IdP. No Keycloak, no realm_access/resource_access.
const ISSUER = process.env.AUTH_JWT_ISSUER || process.env.JWT_ISSUER || 'baalvion-auth';
const AUDIENCE = process.env.JWT_AUDIENCE || 'baalvion-platform';
const JWKS_URI =
  process.env.AUTH_JWKS_URI ||
  `${process.env.AUTH_SERVICE_URL || 'http://baalvion-auth:3001'}/.well-known/jwks.json`;

/**
 * Validates canonical auth-service RS256 access tokens against auth-service JWKS.
 * Roles come from the canonical `roles[]` claim (not Keycloak realm_access).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'canonical') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: JWKS_URI,
      }),
    });
  }

  validate(payload: Record<string, any>): AuthUser {
    if (!payload?.sub) throw new UnauthorizedException('Invalid token: missing subject');
    const roles: string[] = Array.isArray(payload.roles)
      ? payload.roles
      : payload.role != null
      ? [payload.role]
      : [];
    return {
      userId: payload.sub,
      keycloakId: payload.sub, // DEPRECATED alias (users.keycloakId rename = follow-up)
      email: payload.email,
      name: payload.name ?? payload.preferred_username,
      orgId: payload.org_id,
      sessionId: payload.sid,
      roles,
      raw: payload,
    };
  }
}
