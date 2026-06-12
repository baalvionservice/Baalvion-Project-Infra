import { IsString, Length } from 'class-validator';

export class MfaCodeDto {
  @IsString()
  @Length(6, 6, { message: 'TOTP code must be 6 digits' })
  code!: string;
}

export class MfaLoginDto {
  @IsString()
  challengeToken!: string;

  @IsString()
  @Length(6, 6, { message: 'TOTP code must be 6 digits' })
  code!: string;
}
