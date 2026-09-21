import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class LoginDto {
  @IsString() username!: string;
  @IsString() @MinLength(6) password!: string;
}

export class RegisterDto {
  @IsString() username!: string;
  @IsString() name!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() phone?: string;
  @IsString() @MinLength(8) password!: string;
}
