import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary } from "cloudinary";

@Injectable()
export class MediaService implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    cloudinary.config({
      cloud_name: this.configService.get<string>("CLOUDINARY_CLOUD_NAME") || "mock_cloud",
      api_key: this.configService.get<string>("CLOUDINARY_API_KEY") || "mock_key",
      api_secret: this.configService.get<string>("CLOUDINARY_API_SECRET") || "mock_secret",
    });
  }

  async getSignedUploadSignature(folder = "element5") {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const apiSecret = cloudinary.config().api_secret;

    if (!apiSecret || apiSecret === "mock_secret") {
      // Return dummy signature config if keys are not configured
      return {
        timestamp,
        signature: "mock_signature_hash_2026",
        cloudName: cloudinary.config().cloud_name,
        apiKey: cloudinary.config().api_key,
        folder,
      };
    }

    const signature = cloudinary.utils.sign_request(
      { timestamp, folder },
      { api_secret: apiSecret },
    );

    return {
      timestamp,
      signature,
      cloudName: cloudinary.config().cloud_name,
      apiKey: cloudinary.config().api_key,
      folder,
    };
  }
}
