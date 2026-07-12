import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { EventCategory } from "@prisma/client";

export class CreateEventDto {
  @ApiProperty({ example: "Nexus Music Festival" })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: "The largest creator visual arts show.", required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: "STAGEVERSE", enum: EventCategory })
  @IsEnum(EventCategory)
  @IsNotEmpty()
  category!: EventCategory;

  @ApiProperty({ example: 500, required: false })
  @IsInt()
  @IsOptional()
  maxCapacity?: number;

  @ApiProperty({ example: "2026-10-15T18:00:00Z" })
  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @ApiProperty({ example: "2026-10-15T23:00:00Z", required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ example: "2026-10-12T23:59:00Z", required: false })
  @IsDateString()
  @IsOptional()
  registrationEndDate?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiProperty({ example: 0.00, required: false })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiProperty({ example: 0.00, required: false })
  @IsNumber()
  @IsOptional()
  audiencePrice?: number;

  @ApiProperty({ example: 0.00, required: false })
  @IsNumber()
  @IsOptional()
  artistPrice?: number;

  @ApiProperty({ example: "nexus@upi", required: false })
  @IsString()
  @IsOptional()
  upiVpa?: string;

  @ApiProperty({ example: "nexus@upi", required: false })
  @IsString()
  @IsOptional()
  upiId?: string;

  @ApiProperty({ example: "https://res.cloudinary.com/demo/image/upload/upi.png", required: false })
  @IsString()
  @IsOptional()
  upiQrUrl?: string;

  @ApiProperty({ example: "https://res.cloudinary.com/demo/image/upload/upi.png", required: false })
  @IsString()
  @IsOptional()
  artistQrUrl?: string;

  @ApiProperty({ example: "https://res.cloudinary.com/demo/image/upload/upi.png", required: false })
  @IsString()
  @IsOptional()
  audienceQrUrl?: string;

  @ApiProperty({ example: "https://res.cloudinary.com/demo/image/upload/flyer.png", required: false })
  @IsString()
  @IsOptional()
  flyerUrl?: string;

  @ApiProperty({ example: "Digital Dome" })
  @IsString()
  @IsNotEmpty()
  venueName!: string;

  @ApiProperty({ example: "123 Cyber Way" })
  @IsString()
  @IsNotEmpty()
  venueAddress!: string;

  @ApiProperty({ example: "https://maps.google.com/?q=Digital+Dome", required: false })
  @IsString()
  @IsOptional()
  mapsLink?: string;

  @ApiProperty({ example: "San Francisco" })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: "California" })
  @IsString()
  @IsNotEmpty()
  state!: string;

  @ApiProperty({ example: "Entry closes 15 minutes after start.", required: false })
  @IsString()
  @IsOptional()
  termsConditions?: string;

  @ApiProperty({
    example: [{ label: "Instagram handle", type: "text", required: false }],
    required: false,
  })
  @IsArray()
  @IsOptional()
  customFields?: Array<Record<string, unknown>>;
}
