import { Test, type TestingModule } from "@nestjs/testing";
import { XpService } from "../application/xp.service.js";
import { ParticipantJoinedEvent } from "../domain/xp-events.js";
import { ParticipantJoinedXpListener } from "./participant-joined-xp.listener.js";

describe("ParticipantJoinedXpListener", () => {
  let listener: ParticipantJoinedXpListener;
  const mockXpService = { awardXp: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipantJoinedXpListener,
        { provide: XpService, useValue: mockXpService },
      ],
    }).compile();

    listener = module.get<ParticipantJoinedXpListener>(
      ParticipantJoinedXpListener
    );
  });

  it("should call awardXp with correct params", async () => {
    mockXpService.awardXp.mockResolvedValue({ awarded: true });
    const event = new ParticipantJoinedEvent("user-1", "event-1", "host-1");

    await listener.handle(event);

    expect(mockXpService.awardXp).toHaveBeenCalledWith(
      "user-1",
      "participant_joined",
      {
        eventId: "event-1",
      }
    );
  });

  it("should skip XP when user is the host", async () => {
    const event = new ParticipantJoinedEvent("host-1", "event-1", "host-1");

    await listener.handle(event);

    expect(mockXpService.awardXp).not.toHaveBeenCalled();
  });

  it("should not rethrow when awardXp fails", async () => {
    mockXpService.awardXp.mockRejectedValue(new Error("DB down"));
    const event = new ParticipantJoinedEvent("user-1", "event-1", "host-1");

    await expect(listener.handle(event)).resolves.toBeUndefined();
    expect(mockXpService.awardXp).toHaveBeenCalledOnce();
  });
});
