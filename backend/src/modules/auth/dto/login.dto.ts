import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({ example: "creator@element5.com", description: "The unique registration email of the user" })
  @IsEmail({}, { message: "Please supply a valid email address" })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: "SecurePass2026!", description: "The plain-text authentication password" })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  password!: string;

  @ApiProperty({ example: "123456", description: "Optional 6-digit TOTP verification token for administrators", required: false })
  @IsString()
  @IsOptional()
  totpToken?: string;
}
