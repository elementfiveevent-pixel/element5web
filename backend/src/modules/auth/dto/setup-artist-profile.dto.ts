import { IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SetupArtistProfileDto {
  @ApiProperty({ example: "MC Kavyo", required: false })
  @IsOptional()
  stageName?: string;

  @ApiProperty({ example: "mckavyo", required: false })
  @IsOptional()
  instagramHandle?: string;

  @ApiProperty({ example: "Rap", required: false })
  @IsOptional()
  genre?: string;

  @ApiProperty({ example: "NEWBIE", required: false })
  @IsOptional()
  experienceLevel?: string;

  @ApiProperty({ example: "Tell your story.", required: false })
  @IsOptional()
  bio?: string;

  @ApiProperty({ example: "English, Hindi", required: false })
  @IsOptional()
  languages?: any;

  @ApiProperty({ example: "Open for Gigs", required: false })
  @IsOptional()
  availability?: string;

  @ApiProperty({ example: "Freestyle, Lyricism", required: false })
  @IsOptional()
  skills?: any;

  @ApiProperty({ example: "https://open.spotify.com/...", required: false })
  @IsOptional()
  spotifyLink?: string;

  @ApiProperty({ example: "Featured in open mic...", required: false })
  @IsOptional()
  pastAchievement?: string;

  @ApiProperty({ example: "https://youtube.com/...", required: false })
  @IsOptional()
  youtubeLink?: string;

  @ApiProperty({ example: "https://images.unsplash.com/...", required: false })
  @IsOptional()
  profilePhotoUrl?: string;

  @ApiProperty({ example: "Rajkot", required: false })
  @IsOptional()
  city?: string;

  @ApiProperty({ example: "Gujarat", required: false })
  @IsOptional()
  state?: string;
}
