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

  async uploadToSupabase(base64Data: string, folder: string, fileName: string) {
    const supabaseUrl = this.configService.get<string>("SUPABASE_URL");
    const supabaseAnonKey = this.configService.get<string>("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase credentials missing on backend config");
    }

    const match = base64Data.match(/^data:([a-zA-Z0-9/+. -]+);base64,(.+)$/);
    if (!match) {
      throw new Error("Invalid base64 data format");
    }

    const mimeType = match[1];
    const base64Content = match[2];
    const buffer = Buffer.from(base64Content, "base64");

    const filePath = `${folder}/${fileName}`;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/media/${filePath}`;

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseAnonKey}`,
        "Content-Type": mimeType,
      },
      body: buffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase upload failed: ${errorText}`);
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/media/${filePath}`;
    return {
      url: publicUrl,
      publicUrl,
    };
  }
}
