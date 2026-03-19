import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { LocationsModule } from "../locations/locations.module.js";
import { ParticipantsModule } from "../participants/participants.module.js";
import { EventsService } from "./application/events.service.js";
import { EventCreatedListener } from "./application/listeners/event-created.listener.js";
import { LocationCreatedListener } from "./application/listeners/location-created.listener.js";
import { EventsController } from "./presentation/events.controller.js";

@Module({
  imports: [AuthModule, LocationsModule, ParticipantsModule],
  controllers: [EventsController],
  providers: [EventsService, LocationCreatedListener, EventCreatedListener],
  exports: [EventsService],
})
export class EventsModule {}
