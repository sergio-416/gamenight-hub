import type { LocationCreatedEvent } from "@locations/domain/events/location-created.event";
import { Inject, Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { EVENT_COLORS } from "../constants/event-colors.js";
import { EventsService } from "../events.service.js";

@Injectable()
export class LocationCreatedListener {
  constructor(
    @Inject(EventsService) private readonly eventsService: EventsService
  ) {}

  @OnEvent("location.created")
  async handleLocationCreated(event: LocationCreatedEvent): Promise<void> {
    if (!event.eventDate) {
      return;
    }

    const startTime = new Date(event.eventDate);
    const endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000);

    await this.eventsService.create(
      {
        title: `Game Night at ${event.name}`,
        description: `Join us for a game night at ${event.name}${event.address ? ` (${event.address})` : ""}`,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        locationId: event.locationId,
        maxPlayers: event.capacity ?? 8,
        color: EVENT_COLORS.LOCATION_CREATED,
      },
      event.createdBy
    );
  }
}
