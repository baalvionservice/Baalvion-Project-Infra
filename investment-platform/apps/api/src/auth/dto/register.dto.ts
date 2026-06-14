import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters' })
  @Matches(/[A-Z]/, { message: 'Password must contain an uppercase letter' })
  @Matches(/[a-z]/, { message: 'Password must contain a lowercase letter' })
  @Matches(/[0-9]/, { message: 'Password must contain a digit' })
  password!: string;

  @IsString()
  @Length(2, 120)
  fullName!: string;

  @IsOptional()
  @IsString()
  @Length(2, 2, { message: 'country must be an ISO 3166-1 alpha-2 code' })
  country?: string;
}
