import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";

export class RegisterDto {
  @ApiProperty({ example: "artist@element5.com", description: "The email address for the account" })
  @IsEmail({}, { message: "Please supply a valid email address" })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: "SecurePass2026!", description: "The password for the account" })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  password!: string;

  @ApiProperty({ example: "Sarah Connor", description: "The full legal or stage name of the user" })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: "+1555019909", description: "Optional mobile phone contact number", required: false })
  @IsString()
  @IsOptional()
  mobileNumber?: string;

  @ApiProperty({ example: "ARTIST", description: "The primary account role to associate", enum: UserRole, required: false })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
