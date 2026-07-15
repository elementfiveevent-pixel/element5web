import { IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SetupArtistProfileDto {
  @ApiProperty({ example: "MC Kavyo", required: false })
  @IsString()
  @IsOptional()
  stageName?: string;

  @ApiProperty({ example: "mckavyo", required: false })
  @IsString()
  @IsOptional()
  instagramHandle?: string;

  @ApiProperty({ example: "Rap", required: false })
  @IsString()
  @IsOptional()
  genre?: string;

  @ApiProperty({ example: "NEWBIE", required: false })
  @IsString()
  @IsOptional()
  experienceLevel?: string;

  @ApiProperty({ example: "Tell your story.", required: false })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ example: "English, Hindi", required: false })
  @IsString()
  @IsOptional()
  languages?: string;

  @ApiProperty({ example: "Open for Gigs", required: false })
  @IsString()
  @IsOptional()
  availability?: string;

  @ApiProperty({ example: "Freestyle, Lyricism", required: false })
  @IsString()
  @IsOptional()
  skills?: string;

  @ApiProperty({ example: "https://open.spotify.com/...", required: false })
  @IsString()
  @IsOptional()
  spotifyLink?: string;

  @ApiProperty({ example: "Featured in open mic...", required: false })
  @IsString()
  @IsOptional()
  pastAchievement?: string;

  @ApiProperty({ example: "https://youtube.com/...", required: false })
  @IsString()
  @IsOptional()
  youtubeLink?: string;

  @ApiProperty({ example: "https://images.unsplash.com/...", required: false })
  @IsString()
  @IsOptional()
  profilePhotoUrl?: string;

  @ApiProperty({ example: "Rajkot", required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: "Gujarat", required: false })
  @IsString()
  @IsOptional()
  state?: string;
}
