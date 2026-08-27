import { IsArray, IsEnum, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { AvailabilityStatus } from "@prisma/client";

export class UpdateArtistProfileDto {
  @ApiProperty({ example: "DJ Zenith", required: false })
  @IsString()
  @IsOptional()
  stageName?: string;

  @ApiProperty({ example: "mckavyo", required: false })
  @IsString()
  @IsOptional()
  instagramHandle?: string;

  @ApiProperty({ example: "Producer of progressive techno beats.", required: false })
  @IsString()
  @IsOptional()
  biography?: string;

  @ApiProperty({ example: "Featured in Open Mic 2.0", required: false })
  @IsOptional()
  pastAchievement?: string;

  @ApiProperty({ example: ["https://youtube.com/my-set"], required: false })
  @IsArray()
  @IsOptional()
  portfolioUrls?: string[];

  @ApiProperty({ example: ["Electronic", "Techno"], required: false })
  @IsOptional()
  genres?: any;

  @ApiProperty({ example: ["Synthesizers", "DJing"], required: false })
  @IsOptional()
  skills?: any;

  @ApiProperty({ example: ["English", "Spanish"], required: false })
  @IsOptional()
  languages?: any;

  @ApiProperty({ example: "AVAILABLE", enum: AvailabilityStatus, required: false })
  @IsEnum(AvailabilityStatus)
  @IsOptional()
  availabilityStatus?: AvailabilityStatus;
}
