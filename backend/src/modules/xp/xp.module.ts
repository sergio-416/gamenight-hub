import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { XpService } from "./application/xp.service.js";
import { EventCreatedXpListener } from "./listeners/event-created-xp.listener.js";
import { GameAddedXpListener } from "./listeners/game-added-xp.listener.js";
import { ParticipantJoinedXpListener } from "./listeners/participant-joined-xp.listener.js";
import { ProfileCreatedXpListener } from "./listeners/profile-created-xp.listener.js";
import { XpController } from "./presentation/xp.controller.js";
import { XpCalculatorService } from "./xp-calculator.service.js";

@Module({
  imports: [AuthModule],
  controllers: [XpController],
  providers: [
    XpCalculatorService,
    XpService,
    GameAddedXpListener,
    EventCreatedXpListener,
    ParticipantJoinedXpListener,
    ProfileCreatedXpListener,
  ],
  exports: [XpService, XpCalculatorService],
})
export class XpModule {}
