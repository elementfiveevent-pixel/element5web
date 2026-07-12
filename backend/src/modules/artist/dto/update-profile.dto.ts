import { IsArray, IsEnum, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { AvailabilityStatus } from "@prisma/client";

export class UpdateArtistProfileDto {
  @ApiProperty({ example: "DJ Zenith", required: false })
  @IsString()
  @IsOptional()
  stageName?: string;

  @ApiProperty({ example: "Producer of progressive techno beats.", required: false })
  @IsString()
  @IsOptional()
  biography?: string;

  @ApiProperty({ example: ["https://youtube.com/my-set"], required: false })
  @IsArray()
  @IsOptional()
  portfolioUrls?: string[];

  @ApiProperty({ example: ["Electronic", "Techno"], required: false })
  @IsArray()
  @IsOptional()
  genres?: string[];

  @ApiProperty({ example: ["Synthesizers", "DJing"], required: false })
  @IsArray()
  @IsOptional()
  skills?: string[];

  @ApiProperty({ example: ["English", "Spanish"], required: false })
  @IsArray()
  @IsOptional()
  languages?: string[];

  @ApiProperty({ example: "AVAILABLE", enum: AvailabilityStatus, required: false })
  @IsEnum(AvailabilityStatus)
  @IsOptional()
  availabilityStatus?: AvailabilityStatus;
}
