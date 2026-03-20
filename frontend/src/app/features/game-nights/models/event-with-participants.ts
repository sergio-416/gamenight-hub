import type { Event } from '@features/calendar/models/event.model';

export type EventWithParticipants = Event & { participantCount?: number };
