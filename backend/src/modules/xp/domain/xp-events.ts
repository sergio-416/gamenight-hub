export class GameAddedEvent {
  constructor(
    public readonly userId: string,
    public readonly gameId: string,
    public readonly gameName: string
  ) {}
}

export class ParticipantJoinedEvent {
  constructor(
    public readonly userId: string,
    public readonly eventId: string,
    public readonly hostId: string
  ) {}
}

export class ProfileCreatedEvent {
  constructor(public readonly userId: string) {}
}
