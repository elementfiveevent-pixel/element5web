import { Module } from "@nestjs/common";
import { EventService } from "./event.service";
import { EventController } from "./event.controller";
import { EmailModule } from "../email/email.module";

@Module({
  controllers: [EventController],
  imports: [EmailModule],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
