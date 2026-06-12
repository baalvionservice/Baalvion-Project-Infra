import { IsOptional, IsString } from 'class-validator';

export class RefreshDto {
  // Optional in body — the refresh token is also accepted from an httpOnly cookie.
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
