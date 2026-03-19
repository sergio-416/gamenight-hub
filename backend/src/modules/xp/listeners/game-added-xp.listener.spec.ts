import { Test, type TestingModule } from "@nestjs/testing";
import { XpService } from "../application/xp.service.js";
import { GameAddedEvent } from "../domain/xp-events.js";
import { GameAddedXpListener } from "./game-added-xp.listener.js";

describe("GameAddedXpListener", () => {
  let listener: GameAddedXpListener;
  const mockXpService = { awardXp: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameAddedXpListener,
        { provide: XpService, useValue: mockXpService },
      ],
    }).compile();

    listener = module.get<GameAddedXpListener>(GameAddedXpListener);
  });

  it("should call awardXp with correct params", async () => {
    mockXpService.awardXp.mockResolvedValue({ awarded: true });
    const event = new GameAddedEvent("user-1", "game-1", "Catan");

    await listener.handle(event);

    expect(mockXpService.awardXp).toHaveBeenCalledWith("user-1", "game_added", {
      gameId: "game-1",
      gameName: "Catan",
    });
  });

  it("should not rethrow when awardXp fails", async () => {
    mockXpService.awardXp.mockRejectedValue(new Error("DB down"));
    const event = new GameAddedEvent("user-1", "game-1", "Catan");

    await expect(listener.handle(event)).resolves.toBeUndefined();
    expect(mockXpService.awardXp).toHaveBeenCalledOnce();
  });
});
