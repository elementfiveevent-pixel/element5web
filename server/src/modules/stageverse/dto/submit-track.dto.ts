import { IsNotEmpty, IsString, IsUrl } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SubmitTrackDto {
  @ApiProperty({ example: "e9e0c6e5-53ce-4eed-8afd-0ae0cb04ecfb" })
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @ApiProperty({ example: "Cyber Sunset (Live Synthesizer Set)" })
  @IsString()
  @IsNotEmpty()
  trackTitle!: string;

  @ApiProperty({ example: "https://cloudinary.com/video.mp4" })
  @IsUrl()
  @IsNotEmpty()
  audioVideoUrl!: string;
}
