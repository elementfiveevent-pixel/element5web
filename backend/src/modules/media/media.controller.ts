import { Controller, Get, Post, Body, Query, UseGuards } from "@nestjs/common";
import { MediaService } from "./media.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("Media Assets Services")
@Controller("media")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Get("signature")
  @ApiOperation({ summary: "Request secure Cloudinary client-side upload authorization signature" })
  async getSignature(@Query("folder") folder?: string) {
    return this.mediaService.getSignedUploadSignature(folder);
  }

  @Post("upload")
  @ApiOperation({ summary: "Upload a file in base64 format directly to Supabase storage" })
  async uploadFile(@Body() body: { base64Data: string; folder: string; fileName: string }) {
    return this.mediaService.uploadToSupabase(body.base64Data, body.folder, body.fileName);
  }
}
