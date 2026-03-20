export class EventCreatedEvent {
	constructor(
		public readonly eventId: string,
		public readonly title: string,
		public readonly createdBy: string,
	) {}
}
