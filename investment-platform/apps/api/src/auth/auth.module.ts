import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { MfaService } from './mfa.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        privateKey: config.getOrThrow<string>('jwt.accessPrivateKey'),
        publicKey: config.getOrThrow<string>('jwt.accessPublicKey'),
        signOptions: {
          algorithm: 'RS256',
          issuer: 'baalvion-invest',
          audience: 'baalvion-platform',
        },
        verifyOptions: {
          algorithms: ['RS256'],
          issuer: 'baalvion-invest',
          audience: 'baalvion-platform',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    MfaService,
    JwtStrategy,
  ],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
