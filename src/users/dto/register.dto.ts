import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  IsEnum,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsEnum(['customer', 'admin', 'seller'])
  role?: 'customer' | 'admin' | 'seller';
}
