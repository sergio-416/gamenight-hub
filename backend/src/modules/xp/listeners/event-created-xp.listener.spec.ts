import { EventCreatedEvent } from "@events/domain/events/event-created.event";
import { Test, type TestingModule } from "@nestjs/testing";
import { XpService } from "../application/xp.service.js";
import { EventCreatedXpListener } from "./event-created-xp.listener.js";

describe("EventCreatedXpListener", () => {
  let listener: EventCreatedXpListener;
  const mockXpService = { awardXp: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventCreatedXpListener,
        { provide: XpService, useValue: mockXpService },
      ],
    }).compile();

    listener = module.get<EventCreatedXpListener>(EventCreatedXpListener);
  });

  it("should call awardXp with correct params", async () => {
    mockXpService.awardXp.mockResolvedValue({ awarded: true });
    const event = new EventCreatedEvent("event-1", "Game Night", "host-1");

    await listener.handle(event);

    expect(mockXpService.awardXp).toHaveBeenCalledWith(
      "host-1",
      "event_created",
      {
        eventId: "event-1",
      }
    );
  });

  it("should not rethrow when awardXp fails", async () => {
    mockXpService.awardXp.mockRejectedValue(new Error("DB down"));
    const event = new EventCreatedEvent("event-1", "Game Night", "host-1");

    await expect(listener.handle(event)).resolves.toBeUndefined();
    expect(mockXpService.awardXp).toHaveBeenCalledOnce();
  });
});
