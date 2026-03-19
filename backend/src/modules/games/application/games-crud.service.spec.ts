import { DB_TOKEN } from "@database/database.module.js";
import { NotFoundException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { buildMockDb, chainResolving } from "@test/db-mock.js";
import { GamesCrudService } from "./games-crud.service.js";

const OWNER_UID = "user-uid-123";

const makeGame = (overrides = {}) => ({
  id: "507f1f77-bcf8-6cd7-9943-9011aaaabbbb",
  name: "Catan",
  bggId: 13,
  yearPublished: 1995,
  minPlayers: 3,
  maxPlayers: 4,
  playingTime: 90,
  minAge: 10,
  description: "Trade and build settlements",
  categories: ["Strategy", "Family"],
  mechanics: ["Dice Rolling", "Trading"],
  publisher: "Kosmos",
  status: "owned" as const,
  notes: null,
  complexity: 3,
  createdBy: OWNER_UID,
  deletedAt: null,
  createdAt: new Date("2026-01-10"),
  updatedAt: new Date("2026-01-10"),
  ...overrides,
});

describe("GamesCrudService", () => {
  let service: GamesCrudService;
  let mockDb: ReturnType<typeof buildMockDb>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDb = buildMockDb({
      select: [makeGame()],
      insert: [makeGame()],
      update: [makeGame()],
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [GamesCrudService, { provide: DB_TOKEN, useValue: mockDb }],
    }).compile();

    service = module.get<GamesCrudService>(GamesCrudService);
  });

  describe("findOne", () => {
    it("should return game when found and owned by requesting user", async () => {
      const game = makeGame();
      mockDb.select.mockReturnValue(chainResolving([game]));

      const result = await service.findOne(game.id, OWNER_UID);

      expect(result.id).toBe(game.id);
      expect(result.name).toBe("Catan");
      expect(mockDb.select).toHaveBeenCalled();
    });

    it("should throw NotFoundException when game belongs to a different user", async () => {
      mockDb.select.mockReturnValue(chainResolving([]));

      await expect(service.findOne("some-id", OWNER_UID)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw NotFoundException when game does not exist", async () => {
      mockDb.select.mockReturnValue(chainResolving([]));

      await expect(
        service.findOne("nonexistent-id", OWNER_UID)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("findAll", () => {
    it("should return paginated results scoped to the requesting user", async () => {
      const mockGames = [
        makeGame(),
        makeGame({ id: "uuid-2", name: "Ticket to Ride" }),
      ];
      mockDb.select
        .mockReturnValueOnce(chainResolving(mockGames))
        .mockReturnValueOnce(chainResolving([{ value: 2 }]));

      const result = await service.findAll(OWNER_UID);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it("should return empty data array when user has no games", async () => {
      mockDb.select
        .mockReturnValueOnce(chainResolving([]))
        .mockReturnValueOnce(chainResolving([{ value: 0 }]));

      const result = await service.findAll(OWNER_UID);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("should respect pagination parameters", async () => {
      const mockGames = [makeGame({ id: "uuid-3", name: "Azul" })];
      mockDb.select
        .mockReturnValueOnce(chainResolving(mockGames))
        .mockReturnValueOnce(chainResolving([{ value: 5 }]));

      const result = await service.findAll(OWNER_UID, { page: 2, limit: 2 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(5);
    });
  });

  describe("create", () => {
    it("should insert and return the new game", async () => {
      const newGame = makeGame();
      mockDb.insert.mockReturnValue(chainResolving([newGame]));

      const result = await service.create({
        name: "Catan",
        bggId: 13,
        status: "owned" as const,
        createdBy: OWNER_UID,
      });

      expect(result.id).toBe(newGame.id);
      expect(result.name).toBe("Catan");
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should update and return the modified game", async () => {
      const existing = makeGame();
      const updated = makeGame({
        status: "played" as const,
        notes: "Great game",
      });

      mockDb.select.mockReturnValue(chainResolving([existing]));
      mockDb.update.mockReturnValue(chainResolving([updated]));

      const result = await service.update(
        existing.id,
        { status: "played" as const, notes: "Great game" },
        OWNER_UID
      );

      expect(result.status).toBe("played");
      expect(result.notes).toBe("Great game");
      expect(mockDb.update).toHaveBeenCalled();
    });

    it("should throw NotFoundException when updating a game owned by another user", async () => {
      mockDb.select.mockReturnValue(chainResolving([]));

      await expect(
        service.update(
          "some-other-id",
          { status: "played" as const },
          OWNER_UID
        )
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("should soft-delete the game by setting deletedAt", async () => {
      const game = makeGame();
      mockDb.select.mockReturnValue(chainResolving([game]));

      const result = await service.remove(game.id, OWNER_UID);

      expect(result.id).toBe(game.id);
      expect(mockDb.update).toHaveBeenCalled();
    });

    it("should throw NotFoundException when removing a game owned by another user", async () => {
      mockDb.select.mockReturnValue(chainResolving([]));

      await expect(service.remove("some-other-id", OWNER_UID)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("findOneEnriched", () => {
    it("should return game with bggRating and bggRank from LEFT JOIN", async () => {
      const game = makeGame();
      mockDb.select.mockReturnValue(
        chainResolving([{ game, bggRating: "8.30", bggRank: 16 }])
      );

      const result = await service.findOneEnriched(game.id, OWNER_UID);

      expect(result.bggRating).toBe(8.3);
      expect(result.bggRank).toBe(16);
      expect(result.name).toBe("Catan");
    });

    it("should return null rating/rank when no bgg_games match", async () => {
      const game = makeGame({ bggId: null });
      mockDb.select.mockReturnValue(
        chainResolving([{ game, bggRating: null, bggRank: null }])
      );

      const result = await service.findOneEnriched(game.id, OWNER_UID);

      expect(result.bggRating).toBeNull();
      expect(result.bggRank).toBeNull();
    });

    it("should throw NotFoundException when game not found", async () => {
      mockDb.select.mockReturnValue(chainResolving([]));

      await expect(
        service.findOneEnriched("nonexistent", OWNER_UID)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("findCollectionRecommendations", () => {
    it("should return category-matched games first then random", async () => {
      const current = makeGame({ categories: ["Strategy"] });
      const match1 = makeGame({
        id: "uuid-m1",
        name: "Scythe",
        categories: ["Strategy"],
      });
      const match2 = makeGame({
        id: "uuid-m2",
        name: "Root",
        categories: ["Strategy", "War"],
      });
      const noMatch = makeGame({
        id: "uuid-nm",
        name: "Codenames",
        categories: ["Party"],
      });

      mockDb.select.mockReturnValue(
        chainResolving([current, match1, match2, noMatch])
      );

      const result = await service.findCollectionRecommendations(
        current.id,
        OWNER_UID
      );

      expect(result.length).toBeLessThanOrEqual(5);
      expect(result.every((g) => g.id !== current.id)).toBe(true);
    });

    it("should return empty array when only current game exists", async () => {
      const current = makeGame();
      mockDb.select.mockReturnValue(chainResolving([current]));

      const result = await service.findCollectionRecommendations(
        current.id,
        OWNER_UID
      );

      expect(result).toEqual([]);
    });

    it("should not include duplicates across slots", async () => {
      const current = makeGame({ categories: ["Strategy"] });
      const g1 = makeGame({
        id: "uuid-1",
        name: "G1",
        categories: ["Strategy"],
      });
      const g2 = makeGame({
        id: "uuid-2",
        name: "G2",
        categories: ["Strategy"],
      });
      const g3 = makeGame({
        id: "uuid-3",
        name: "G3",
        categories: ["Strategy"],
      });
      const g4 = makeGame({ id: "uuid-4", name: "G4", categories: ["Party"] });
      const g5 = makeGame({ id: "uuid-5", name: "G5", categories: ["Party"] });
      const g6 = makeGame({ id: "uuid-6", name: "G6", categories: ["Party"] });

      mockDb.select.mockReturnValue(
        chainResolving([current, g1, g2, g3, g4, g5, g6])
      );

      const result = await service.findCollectionRecommendations(
        current.id,
        OWNER_UID
      );

      const ids = result.map((g) => g.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });
});
