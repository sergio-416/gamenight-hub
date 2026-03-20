import { DB_TOKEN } from "@database/database.module.js";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Test, type TestingModule } from "@nestjs/testing";
import { buildMockDb, chainResolving } from "@test/db-mock.js";
import { XpCalculatorService } from "../xp-calculator.service.js";
import { XpService } from "./xp.service.js";

const USER_ID = "user-uid-123";

const makeProfile = (overrides = {}) => ({
  userId: USER_ID,
  xpTotal: 0,
  level: 1,
  streakWeeks: 0,
  lastActivityAt: null,
  monthlyGameAdds: 0,
  monthlyGameAddsResetAt: new Date("2026-03-01"),
  createdAt: new Date("2026-03-01"),
  updatedAt: new Date("2026-03-01"),
  ...overrides,
});

const makeTransaction = (overrides = {}) => ({
  id: "tx-uuid-1",
  userId: USER_ID,
  action: "game_added",
  baseXp: 75,
  multiplier: "1.0000",
  finalXp: 75,
  metadata: {},
  dailyActionTotal: 75,
  dailyGrandTotal: 75,
  createdAt: new Date("2026-03-17T12:00:00Z"),
  ...overrides,
});

function _buildTxMockDb(
  values: { select?: unknown[]; insert?: unknown; update?: unknown } = {}
) {
  const selectValues = values.select ?? [];
  let selectCallIndex = 0;

  const txDb = {
    select: vi.fn(() => {
      const val =
        selectCallIndex < selectValues.length
          ? selectValues[selectCallIndex]
          : (selectValues[selectValues.length - 1] ?? []);
      selectCallIndex++;
      return chainResolving(val);
    }),
    insert: vi.fn(() => chainResolving(values.insert ?? [])),
    update: vi.fn(() => chainResolving(values.update ?? [])),
  };

  return txDb;
}

describe("XpService", () => {
  let service: XpService;
  let mockDb: ReturnType<typeof buildMockDb> & {
    transaction: ReturnType<typeof vi.fn>;
  };
  let mockEventEmitter: { emit: ReturnType<typeof vi.fn> };
  let _calculator: XpCalculatorService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const baseMockDb = buildMockDb({
      select: [makeProfile()],
      insert: [makeProfile()],
      update: [makeProfile()],
    });
    mockDb = {
      ...baseMockDb,
      transaction: vi.fn(),
    };
    mockEventEmitter = { emit: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        XpService,
        XpCalculatorService,
        { provide: DB_TOKEN, useValue: mockDb },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<XpService>(XpService);
    _calculator = module.get<XpCalculatorService>(XpCalculatorService);
  });

  describe("createProfile", () => {
    it("should insert and return a new XP profile", async () => {
      const profile = makeProfile();
      mockDb.select.mockReturnValue(chainResolving([profile]));

      const result = await service.createProfile(USER_ID);

      expect(result.userId).toBe(USER_ID);
      expect(result.xpTotal).toBe(0);
      expect(result.level).toBe(1);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("should handle duplicate by using onConflictDoNothing and returning existing", async () => {
      const existingProfile = makeProfile({ xpTotal: 500 });
      mockDb.select.mockReturnValue(chainResolving([existingProfile]));

      const result = await service.createProfile(USER_ID);

      expect(result.userId).toBe(USER_ID);
      expect(result.xpTotal).toBe(500);
    });
  });

  describe("getProfile", () => {
    it("should return enriched XP profile for existing user", async () => {
      const profile = makeProfile({ xpTotal: 300, level: 2 });
      mockDb.select.mockReturnValue(chainResolving([profile]));

      const result = await service.getProfile(USER_ID);

      expect(result).not.toBeNull();
      expect(result?.userId).toBe(USER_ID);
      expect(result?.xpTotal).toBe(300);
      expect(result?.levelTitle).toBe("Curious Collector");
      expect(result?.progressPercent).toBeDefined();
      expect(result?.xpToNextLevel).toBeDefined();
    });

    it("should return null for non-existent user", async () => {
      mockDb.select.mockReturnValue(chainResolving([]));

      const result = await service.getProfile("nonexistent-uid");

      expect(result).toBeNull();
    });
  });

  describe("getHistory", () => {
    it("should return paginated transaction history", async () => {
      const tx1 = makeTransaction();
      const tx2 = makeTransaction({
        id: "tx-uuid-2",
        finalXp: 40,
        action: "event_created",
      });

      mockDb.select
        .mockReturnValueOnce(chainResolving([tx1, tx2]))
        .mockReturnValueOnce(chainResolving([{ value: 2 }]));

      const result = await service.getHistory(USER_ID, 1, 20);

      expect(result.transactions).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.transactions[0].multiplier).toBeTypeOf("number");
    });

    it("should return empty when no transactions exist", async () => {
      mockDb.select
        .mockReturnValueOnce(chainResolving([]))
        .mockReturnValueOnce(chainResolving([{ value: 0 }]));

      const result = await service.getHistory(USER_ID, 1, 20);

      expect(result.transactions).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("getStats", () => {
    it("should return XP statistics for user", async () => {
      const profile = makeProfile({ streakWeeks: 3 });
      mockDb.select
        .mockReturnValueOnce(chainResolving([{ value: 150 }]))
        .mockReturnValueOnce(chainResolving([{ value: 75 }]))
        .mockReturnValueOnce(chainResolving([{ value: 5 }]))
        .mockReturnValueOnce(
          chainResolving([{ action: "game_added", total: 300 }])
        )
        .mockReturnValueOnce(chainResolving([profile]));

      const result = await service.getStats(USER_ID);

      expect(result.monthlyXp).toBe(150);
      expect(result.weeklyXp).toBe(75);
      expect(result.totalTransactions).toBe(5);
      expect(result.currentStreak).toBe(3);
      expect(result.topAction).toBe("game_added");
    });

    it("should return null topAction when no transactions exist", async () => {
      mockDb.select
        .mockReturnValueOnce(chainResolving([{ value: 0 }]))
        .mockReturnValueOnce(chainResolving([{ value: 0 }]))
        .mockReturnValueOnce(chainResolving([{ value: 0 }]))
        .mockReturnValueOnce(chainResolving([]))
        .mockReturnValueOnce(chainResolving([]));

      const result = await service.getStats(USER_ID);

      expect(result.topAction).toBeNull();
      expect(result.currentStreak).toBe(0);
    });
  });

  describe("awardXp", () => {
    function setupTxMock(
      selectSequence: unknown[][],
      insertResult: unknown[] = [makeTransaction()],
      updateResult: unknown[] = [makeProfile()]
    ) {
      let callIndex = 0;
      const txDb = {
        select: vi.fn(() => {
          const val =
            callIndex < selectSequence.length
              ? selectSequence[callIndex]
              : selectSequence[selectSequence.length - 1];
          callIndex++;
          return chainResolving(val);
        }),
        insert: vi.fn(() => chainResolving(insertResult)),
        update: vi.fn(() => chainResolving(updateResult)),
      };

      mockDb.transaction.mockImplementation(
        async (cb: (tx: unknown) => unknown) => {
          return cb(txDb);
        }
      );

      return txDb;
    }

    it("should award XP for game_added with tier calculation", async () => {
      const profile = makeProfile({ monthlyGameAdds: 2 });
      const tx = makeTransaction({ baseXp: 75, finalXp: 75 });

      setupTxMock([[profile], [{ value: 0 }], [{ value: 0 }]], [tx]);

      const result = await service.awardXp(USER_ID, "game_added", {
        gameId: "g1",
      });

      expect(result.awarded).toBe(true);
      expect(result.xpAwarded).toBe(75);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        "xp.awarded",
        expect.objectContaining({ userId: USER_ID, action: "game_added" })
      );
    });

    it("should award flat 75 XP for event_created", async () => {
      const profile = makeProfile();
      const tx = makeTransaction({
        action: "event_created",
        baseXp: 75,
        finalXp: 75,
      });

      setupTxMock([[profile], [{ value: 0 }], [{ value: 0 }]], [tx]);

      const result = await service.awardXp(USER_ID, "event_created", {});

      expect(result.awarded).toBe(true);
      expect(result.xpAwarded).toBe(75);
    });

    it("should award flat 40 XP for participant_joined", async () => {
      const profile = makeProfile();
      const tx = makeTransaction({
        action: "participant_joined",
        baseXp: 40,
        finalXp: 40,
      });

      setupTxMock([[profile], [{ value: 0 }], [{ value: 0 }]], [tx]);

      const result = await service.awardXp(USER_ID, "participant_joined", {});

      expect(result.awarded).toBe(true);
      expect(result.xpAwarded).toBe(40);
    });

    it("should cap XP when daily action limit reached", async () => {
      const profile = makeProfile();
      const tx = makeTransaction({ baseXp: 0, finalXp: 0 });

      setupTxMock([[profile], [{ value: 500 }], [{ value: 500 }]], [tx]);

      const result = await service.awardXp(USER_ID, "game_added", {});

      expect(result.xpAwarded).toBe(0);
      expect(result.awarded).toBe(false);
    });

    it("should cap XP when daily grand limit reached", async () => {
      const profile = makeProfile();
      const tx = makeTransaction({ baseXp: 0, finalXp: 0 });

      setupTxMock([[profile], [{ value: 0 }], [{ value: 1500 }]], [tx]);

      const result = await service.awardXp(USER_ID, "game_added", {});

      expect(result.xpAwarded).toBe(0);
      expect(result.awarded).toBe(false);
    });

    it("should reset monthly counter when month has changed", async () => {
      const oldResetDate = new Date("2026-02-01");
      const profile = makeProfile({
        monthlyGameAdds: 20,
        monthlyGameAddsResetAt: oldResetDate,
      });
      const tx = makeTransaction({ baseXp: 75, finalXp: 75 });

      const _txDb = setupTxMock(
        [[profile], [{ value: 0 }], [{ value: 0 }]],
        [tx]
      );

      const result = await service.awardXp(USER_ID, "game_added", {});

      expect(result.xpAwarded).toBe(75);
    });

    it("should update streak when activity is in consecutive week", async () => {
      const lastMonday = new Date();
      lastMonday.setUTCDate(lastMonday.getUTCDate() - 7);

      const profile = makeProfile({
        streakWeeks: 3,
        lastActivityAt: lastMonday,
      });
      const tx = makeTransaction({ finalXp: 75 });

      setupTxMock([[profile], [{ value: 0 }], [{ value: 0 }]], [tx]);

      const result = await service.awardXp(USER_ID, "game_added", {});

      expect(result.awarded).toBe(true);
    });

    it("should detect level-up and emit xp.level-up event", async () => {
      const profile = makeProfile({ xpTotal: 240, level: 1 });
      const tx = makeTransaction({ finalXp: 75 });

      setupTxMock([[profile], [{ value: 0 }], [{ value: 0 }]], [tx]);

      const result = await service.awardXp(USER_ID, "game_added", {});

      expect(result.levelUp).toBe(true);
      expect(result.newLevel).toBe(2);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        "xp.level-up",
        expect.objectContaining({ levelUp: true, newLevel: 2 })
      );
    });

    it("should not emit level-up when level unchanged", async () => {
      const profile = makeProfile({ xpTotal: 0, level: 1 });
      const tx = makeTransaction({ finalXp: 75 });

      setupTxMock([[profile], [{ value: 0 }], [{ value: 0 }]], [tx]);

      await service.awardXp(USER_ID, "game_added", {});

      const levelUpCalls = mockEventEmitter.emit.mock.calls.filter(
        ([event]: [string]) => event === "xp.level-up"
      );
      expect(levelUpCalls).toHaveLength(0);
    });

    it("should create profile defensively if none exists during award", async () => {
      const newProfile = makeProfile();
      const tx = makeTransaction({ finalXp: 75 });

      let selectCall = 0;
      const txDb = {
        select: vi.fn(() => {
          selectCall++;
          if (selectCall === 1) return chainResolving([]);
          if (selectCall === 2) return chainResolving([newProfile]);
          return chainResolving([{ value: 0 }]);
        }),
        insert: vi.fn(() => chainResolving([tx])),
        update: vi.fn(() => chainResolving([newProfile])),
      };

      mockDb.transaction.mockImplementation(
        async (cb: (tx: unknown) => unknown) => {
          return cb(txDb);
        }
      );

      const result = await service.awardXp(USER_ID, "game_added", {});

      expect(result.awarded).toBe(true);
    });

    it("should record zero XP transaction when fully capped", async () => {
      const profile = makeProfile();
      const tx = makeTransaction({ baseXp: 0, finalXp: 0 });

      const txDb = setupTxMock(
        [[profile], [{ value: 500 }], [{ value: 1500 }]],
        [tx]
      );

      await service.awardXp(USER_ID, "game_added", {});

      expect(txDb.insert).toHaveBeenCalled();
    });
  });
});
