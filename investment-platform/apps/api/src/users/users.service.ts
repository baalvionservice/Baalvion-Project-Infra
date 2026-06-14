import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import type { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        country: true,
        locale: true,
        timezone: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        memberships: {
          select: {
            role: true,
            org: { select: { id: true, type: true, displayName: true, status: true } },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        country: dto.country?.toUpperCase(),
        locale: dto.locale,
        timezone: dto.timezone,
      },
      select: { id: true, fullName: true, phone: true, country: true },
    });
  }
}
