import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';
import { DealRoomGateway } from './deal-room.gateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        publicKey: config.getOrThrow<string>('jwt.accessPublicKey'),
        privateKey: config.getOrThrow<string>('jwt.accessPrivateKey'),
        signOptions: { algorithm: 'RS256' },
        verifyOptions: { algorithms: ['RS256'] },
      }),
    }),
  ],
  controllers: [DealsController],
  providers: [DealsService, DealRoomGateway],
  exports: [DealsService],
})
export class DealsModule {}
