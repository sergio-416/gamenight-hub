export class LocationCreatedEvent {
  constructor(
    public readonly locationId: string,
    public readonly name: string,
    public readonly address: string | undefined,
    public readonly capacity: number | undefined,
    public readonly eventDate: string | undefined,
    public readonly createdBy: string
  ) {}
}
