import { IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterEventDto {
  @ApiProperty({ example: { experienceLevel: "Advanced" }, description: "Dynamic metadata matching custom question fields", required: false })
  @IsOptional()
  customData?: Record<string, any>;

  @ApiProperty({ example: "https://cloudinary.com/payment.png", description: "Reference URL for manual payment reconciliation", required: false })
  @IsString()
  @IsOptional()
  paymentScreenshotUrl?: string;

  @ApiProperty({ example: "ticket-category-id", description: "Selected ticket category", required: false })
  @IsString()
  @IsOptional()
  ticketCategoryId?: string;
}
