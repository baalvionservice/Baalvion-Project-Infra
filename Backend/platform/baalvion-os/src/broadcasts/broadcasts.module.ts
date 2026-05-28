import { Module } from '@nestjs/common';
import { Controller, Get, Post, Body, Injectable, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';

class CreateBroadcastDto {
  @IsString() title: string;
  @IsOptional() @IsString() body?: string;
  @IsOptional() @IsObject() audience?: Record<string, any>;
}

@Injectable()
class BroadcastsService {
  constructor(private readonly prisma: PrismaService) {}
  list() {
    return this.prisma.broadcast.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }
  create(dto: CreateBroadcastDto) {
    return this.prisma.broadcast.create({
      data: { title: dto.title, body: dto.body ?? null, audience: dto.audience ?? {}, sentAt: new Date() },
    });
  }
}

@ApiTags('broadcasts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('broadcasts')
class BroadcastsController {
  constructor(private readonly svc: BroadcastsService) {}

  @Get()
  list() {
    return this.svc.list();
  }

  @Post()
  @Roles('admin', 'brand')
  create(@Body() dto: CreateBroadcastDto) {
    return this.svc.create(dto);
  }
}

@Module({
  providers: [BroadcastsService],
  controllers: [BroadcastsController],
})
export class BroadcastsModule {}
