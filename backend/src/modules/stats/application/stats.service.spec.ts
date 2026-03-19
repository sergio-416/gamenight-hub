import { DB_TOKEN } from "@database/database.module.js";
import { Test, type TestingModule } from "@nestjs/testing";
import { buildMockDb, chainResolving } from "@test/db-mock.js";
import { StatsService } from "./stats.service.js";

const ORGANISER_UID = "organiser-uid-123";

describe("StatsService", () => {
  let service: StatsService;
  let mockDb: ReturnType<typeof buildMockDb>;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockDb = buildMockDb();

    const module: TestingModule = await Test.createTestingModule({
      providers: [StatsService, { provide: DB_TOKEN, useValue: mockDb }],
    }).compile();

    service = module.get<StatsService>(StatsService);
  });

  describe("getAdminStats()", () => {
    it("should return totalUsers, totalEvents, totalGames", async () => {
      mockDb.select
        .mockReturnValueOnce(chainResolving([{ value: 42 }]))
        .mockReturnValueOnce(chainResolving([{ value: 10 }]))
        .mockReturnValueOnce(chainResolving([{ value: 7 }]));

      const result = await service.getAdminStats();

      expect(result.totalUsers).toBe(42);
      expect(result.totalEvents).toBe(10);
      expect(result.totalGames).toBe(7);
    });

    it("should only count non-deleted events (deletedAt IS NULL)", async () => {
      mockDb.select
        .mockReturnValueOnce(chainResolving([{ value: 5 }]))
        .mockReturnValueOnce(chainResolving([{ value: 3 }]))
        .mockReturnValueOnce(chainResolving([{ value: 2 }]));

      const result = await service.getAdminStats();

      expect(result.totalEvents).toBe(3);
    });
  });

  describe("getOrganiserStats()", () => {
    it("should return eventsHosted, totalAttendees, popularGames", async () => {
      mockDb.select
        .mockReturnValueOnce(chainResolving([{ value: 5 }]))
        .mockReturnValueOnce(chainResolving([{ value: 40 }]))
        .mockReturnValueOnce(
          chainResolving([
            { name: "Catan", eventCount: 3 },
            { name: "Pandemic", eventCount: 2 },
          ])
        );

      const result = await service.getOrganiserStats(ORGANISER_UID);

      expect(result.eventsHosted).toBe(5);
      expect(result.totalAttendees).toBe(40);
      expect(result.popularGames).toHaveLength(2);
      expect(result.popularGames[0].name).toBe("Catan");
      expect(result.popularGames[0].eventCount).toBe(3);
    });

    it("should only count non-deleted events for organiser", async () => {
      mockDb.select
        .mockReturnValueOnce(chainResolving([{ value: 0 }]))
        .mockReturnValueOnce(chainResolving([{ value: 0 }]))
        .mockReturnValueOnce(chainResolving([]));

      const result = await service.getOrganiserStats(ORGANISER_UID);

      expect(result.eventsHosted).toBe(0);
      expect(result.totalAttendees).toBe(0);
      expect(result.popularGames).toHaveLength(0);
    });
  });
});
