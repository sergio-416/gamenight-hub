import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { ParticipantsService } from "./application/participants.service.js";
import { ParticipantsController } from "./presentation/participants.controller.js";

@Module({
  imports: [AuthModule],
  controllers: [ParticipantsController],
  providers: [ParticipantsService],
  exports: [ParticipantsService],
})
export class ParticipantsModule {}
