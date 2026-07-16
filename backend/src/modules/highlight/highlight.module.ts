import { Module } from "@nestjs/common";
import { HighlightService } from "./highlight.service";
import { HighlightController } from "./highlight.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [HighlightController],
  providers: [HighlightService],
  exports: [HighlightService],
})
export class HighlightModule {}
