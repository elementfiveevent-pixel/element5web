import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SubmitScoreDto {
  @ApiProperty({ example: 9, description: "Originality score from 1 to 10" })
  @IsInt()
  @Min(1)
  @Max(10)
  originalityScore!: number;

  @ApiProperty({ example: 8, description: "Technical execution score from 1 to 10" })
  @IsInt()
  @Min(1)
  @Max(10)
  technicalityScore!: number;

  @ApiProperty({ example: 9, description: "Crowd engagement score from 1 to 10" })
  @IsInt()
  @Min(1)
  @Max(10)
  engagementScore!: number;

  @ApiProperty({ example: "Solid drops and sync, crowd interaction was amazing.", required: false })
  @IsString()
  @IsOptional()
  feedback?: string;
}
