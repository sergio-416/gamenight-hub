import { EventEmitter2 } from "@nestjs/event-emitter";
import { Test, type TestingModule } from "@nestjs/testing";
import { BggCsvService } from "./bgg-csv.service.js";
import { BggIntegrationService } from "./bgg-integration.service.js";
import { GamesService } from "./games.service.js";
import { GamesAnalyticsService } from "./games-analytics.service.js";
import { GamesCrudService } from "./games-crud.service.js";
import { UserPlayedGamesService } from "./user-played-games.service.js";

const OWNER_UID = "user-uid-123";

describe("GamesService", () => {
  let service: GamesService;

  const mockBggService = {
    getGameDetails: vi.fn(),
    searchGames: vi.fn(),
  };

  const mockBggCsvService = {
    search: vi.fn(),
  };

  const mockCrudService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    findOwnedBggIds: vi.fn().mockResolvedValue([]),
    update: vi.fn(),
    remove: vi.fn(),
  };

  const mockAnalyticsService = {
    getStats: vi.fn(),
  };

  const mockPlayedGamesService = {
    markAsPlayed: vi.fn(),
    checkIfPlayed: vi.fn(),
    checkIfPlayedByBggId: vi.fn(),
  };

  const mockEventEmitter = {
    emit: vi.fn(),
    emitAsync: vi.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamesService,
        { provide: BggIntegrationService, useValue: mockBggService },
        { provide: BggCsvService, useValue: mockBggCsvService },
        { provide: GamesCrudService, useValue: mockCrudService },
        { provide: GamesAnalyticsService, useValue: mockAnalyticsService },
        { provide: UserPlayedGamesService, useValue: mockPlayedGamesService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<GamesService>(GamesService);
  });

  describe("importFromBgg", () => {
    it("should return imported game with BGG data and personal fields merged", async () => {
      const bggDetails = {
        bggId: 13,
        name: "Catan",
        yearPublished: 1995,
        minPlayers: 3,
        maxPlayers: 4,
        playingTime: 120,
        minAge: 10,
        description: "A strategy game",
        categories: ["Strategy"],
        mechanics: ["Trading"],
        publisher: "KOSMOS",
      };

      const savedGame = {
        id: "uuid-123",
        ...bggDetails,
        status: "owned" as const,
        notes: "My favorite game!",
        complexity: 3,
        createdBy: OWNER_UID,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockBggService.getGameDetails.mockResolvedValue(bggDetails);
      mockCrudService.create.mockResolvedValue(savedGame);
      mockPlayedGamesService.checkIfPlayedByBggId.mockResolvedValue({
        played: false,
        playedAt: null,
      });

      const result = await service.importFromBgg(
        13,
        { status: "owned" as const, notes: "My favorite game!", complexity: 3 },
        OWNER_UID
      );

      expect(result.id).toBeDefined();
      expect(result).toMatchObject({
        bggId: 13,
        name: "Catan",
        status: "owned" as const,
        notes: "My favorite game!",
        complexity: 3,
        createdBy: OWNER_UID,
      });
    });

    it("should return game with default values when personal fields not provided", async () => {
      const bggDetails = {
        bggId: 42,
        name: "Ticket to Ride",
        yearPublished: 2004,
        categories: ["Family"],
        mechanics: ["Card Drafting"],
        publisher: "Days of Wonder",
      };

      const savedGame = {
        id: "uuid-456",
        ...bggDetails,
        status: "want_to_try" as const,
        notes: null,
        complexity: null,
        createdBy: OWNER_UID,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockBggService.getGameDetails.mockResolvedValue(bggDetails);
      mockCrudService.create.mockResolvedValue(savedGame);
      mockPlayedGamesService.checkIfPlayedByBggId.mockResolvedValue({
        played: false,
        playedAt: null,
      });

      const result = await service.importFromBgg(42, {}, OWNER_UID);

      expect(result).toMatchObject({
        bggId: 42,
        name: "Ticket to Ride",
        status: "want_to_try" as const,
      });
    });
  });

  describe("findAll", () => {
    it("should return array of games from collection", async () => {
      const gamesData = [
        { id: "1", name: "Game 1", createdBy: OWNER_UID },
        { id: "2", name: "Game 2", createdBy: OWNER_UID },
      ];
      mockCrudService.findAll.mockResolvedValue({ data: gamesData, total: 2 });

      const result = await service.findAll(OWNER_UID);

      expect(Array.isArray(result.data)).toBe(true);
      expect(result.total).toBe(2);
      expect(result.data[0]).toHaveProperty("name");
      expect(result.totalPages).toBe(1);
    });
  });

  describe("findOne", () => {
    it("should return game when given valid id", async () => {
      mockCrudService.findOne.mockResolvedValue({
        id: "valid-id",
        name: "Catan",
        createdBy: OWNER_UID,
      });

      const result = await service.findOne("valid-id", OWNER_UID);

      expect(result).not.toBeNull();
      expect(result.name).toBe("Catan");
    });

    it("should throw NotFoundException (not ForbiddenException) when game belongs to another user", async () => {
      const { NotFoundException } = await import("@nestjs/common");
      mockCrudService.findOne.mockRejectedValue(
        new NotFoundException("Game with id other-game not found")
      );

      await expect(service.findOne("other-game", OWNER_UID)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("update", () => {
    it("should update personal fields of existing game", async () => {
      const updatedGame = {
        id: "uuid-123",
        bggId: 13,
        name: "Catan",
        status: "owned" as const,
        notes: "Updated notes!",
        complexity: 4,
        createdBy: OWNER_UID,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      mockCrudService.update.mockResolvedValue(updatedGame);

      const result = await service.update(
        "uuid-123",
        { status: "owned" as const, notes: "Updated notes!", complexity: 4 },
        OWNER_UID
      );

      expect(result.status).toBe("owned");
      expect(result.notes).toBe("Updated notes!");
      expect(result.complexity).toBe(4);
    });
  });

  describe("remove", () => {
    it("should soft-delete game from collection", async () => {
      mockCrudService.remove.mockResolvedValue({
        id: "uuid-123",
        name: "Catan",
        createdBy: OWNER_UID,
      });

      const result = await service.remove("uuid-123", OWNER_UID);

      expect(result).not.toBeNull();
      expect(result.id).toBe("uuid-123");
    });
  });

  describe("getStats", () => {
    it("should return aggregated statistics from games collection", async () => {
      const mockStats = {
        totalGames: 3,
        gamesByCategory: [{ name: "Strategy", value: 3 }],
        complexityDistribution: [{ name: "3 - Medium", value: 2 }],
        collectionGrowth: [{ x: "2024-01", y: 2 }],
      };
      mockAnalyticsService.getStats.mockResolvedValue(mockStats);

      const result = await service.getStats(OWNER_UID);

      expect(result.totalGames).toBe(3);
      expect(result.gamesByCategory).toHaveLength(1);
      expect(result.collectionGrowth[0].y).toBe(2);
    });

    it("should return empty stats when collection is empty", async () => {
      mockAnalyticsService.getStats.mockResolvedValue({
        totalGames: 0,
        gamesByCategory: [],
        complexityDistribution: [],
        collectionGrowth: [],
      });

      const result = await service.getStats(OWNER_UID);

      expect(result.totalGames).toBe(0);
      expect(result.gamesByCategory).toHaveLength(0);
    });
  });
});
