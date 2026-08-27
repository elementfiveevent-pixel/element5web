import { Module } from "@nestjs/common";
import { StageVerseService } from "./stageverse.service";
import { StageVerseController } from "./stageverse.controller";
import { StageVerseGateway } from "./stageverse.gateway";

@Module({
  controllers: [StageVerseController],
  providers: [StageVerseService, StageVerseGateway],
  exports: [StageVerseService, StageVerseGateway],
})
export class StageVerseModule {}
