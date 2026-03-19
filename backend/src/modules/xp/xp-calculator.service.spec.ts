import { XpCalculatorService } from "./xp-calculator.service.js";

describe("XpCalculatorService", () => {
  let service: XpCalculatorService;

  beforeEach(() => {
    service = new XpCalculatorService();
  });

  describe("LEVEL_TABLE", () => {
    it("should have 10 levels", () => {
      expect(XpCalculatorService.LEVEL_TABLE).toHaveLength(10);
    });

    it("should start at level 1 with 0 XP", () => {
      expect(XpCalculatorService.LEVEL_TABLE[0].level).toBe(1);
      expect(XpCalculatorService.LEVEL_TABLE[0].xpRequired).toBe(0);
    });

    it("should end at level 10 with 65000 XP", () => {
      expect(XpCalculatorService.LEVEL_TABLE[9].level).toBe(10);
      expect(XpCalculatorService.LEVEL_TABLE[9].xpRequired).toBe(65000);
    });

    it("should be sorted by ascending xpRequired", () => {
      for (let i = 1; i < XpCalculatorService.LEVEL_TABLE.length; i++) {
        expect(XpCalculatorService.LEVEL_TABLE[i].xpRequired).toBeGreaterThan(
          XpCalculatorService.LEVEL_TABLE[i - 1].xpRequired
        );
      }
    });
  });

  describe("calculateGameXp", () => {
    it.each([
      [0, 75],
      [4, 75],
      [5, 20],
      [14, 20],
      [15, 10],
      [29, 10],
      [30, 5],
      [100, 5],
    ])("monthlyCount=%i returns %i XP", (count, expected) => {
      expect(service.calculateGameXp(count)).toBe(expected);
    });
  });

  describe("calculateSoloBonus", () => {
    it.each([
      [0, 1, 25],
      [0, 2, 0],
      [1, 1, 0],
      [5, 1, 0],
    ])(
      "monthlyCount=%i, batchSize=%i returns %i",
      (monthlyCount, batchSize, expected) => {
        expect(service.calculateSoloBonus(monthlyCount, batchSize)).toBe(
          expected
        );
      }
    );
  });

  describe("calculateBatchGameXp", () => {
    it("single game from empty month returns [75]", () => {
      expect(service.calculateBatchGameXp(0, 1)).toEqual([75]);
    });

    it("3 games from empty month returns [75, 75, 75]", () => {
      expect(service.calculateBatchGameXp(0, 3)).toEqual([75, 75, 75]);
    });

    it("2 games crossing tier boundary at count 4 returns [75, 20]", () => {
      expect(service.calculateBatchGameXp(4, 2)).toEqual([75, 20]);
    });

    it("1 game at count 14 returns [20]", () => {
      expect(service.calculateBatchGameXp(14, 1)).toEqual([20]);
    });

    it("2 games crossing tier boundary at count 29 returns [10, 5]", () => {
      expect(service.calculateBatchGameXp(29, 2)).toEqual([10, 5]);
    });

    it("0 batch size returns empty array", () => {
      expect(service.calculateBatchGameXp(0, 0)).toEqual([]);
    });
  });

  describe("getStreakMultiplier", () => {
    it.each([
      [0, 1.0],
      [2, 1.0],
      [3, 1.25],
      [6, 1.25],
      [7, 1.5],
      [29, 1.5],
      [30, 2.0],
      [100, 2.0],
    ])("streakWeeks=%i returns %f", (weeks, expected) => {
      expect(service.getStreakMultiplier(weeks)).toBe(expected);
    });
  });

  describe("getWeekendMultiplier", () => {
    it("returns 1.0 for a weekday (Monday)", () => {
      const monday = new Date("2026-03-16T12:00:00Z");
      expect(service.getWeekendMultiplier(monday)).toBe(1.0);
    });

    it("returns 1.0 for a weekday (Wednesday)", () => {
      const wednesday = new Date("2026-03-18T12:00:00Z");
      expect(service.getWeekendMultiplier(wednesday)).toBe(1.0);
    });

    it("returns 1.1 for Saturday", () => {
      const saturday = new Date("2026-03-14T12:00:00Z");
      expect(service.getWeekendMultiplier(saturday)).toBe(1.1);
    });

    it("returns 1.1 for Sunday", () => {
      const sunday = new Date("2026-03-15T12:00:00Z");
      expect(service.getWeekendMultiplier(sunday)).toBe(1.1);
    });
  });

  describe("getCombinedMultiplier", () => {
    it("returns 1.0 for no streak on a weekday", () => {
      const weekday = new Date("2026-03-16T12:00:00Z");
      expect(service.getCombinedMultiplier(0, weekday)).toBe(1.0);
    });

    it("returns streak * weekend for streak=7 on Saturday", () => {
      const saturday = new Date("2026-03-14T12:00:00Z");
      expect(service.getCombinedMultiplier(7, saturday)).toBeCloseTo(1.65, 5);
    });

    it("returns 2.2 for streak=30 on Sunday", () => {
      const sunday = new Date("2026-03-15T12:00:00Z");
      expect(service.getCombinedMultiplier(30, sunday)).toBeCloseTo(2.2, 5);
    });
  });

  describe("applyDailyCap", () => {
    it("returns full base when no cap hit", () => {
      expect(service.applyDailyCap(75, 0, 0)).toBe(75);
    });

    it("caps at remaining action budget", () => {
      expect(service.applyDailyCap(75, 450, 0)).toBe(50);
    });

    it("caps at remaining grand budget", () => {
      expect(service.applyDailyCap(75, 0, 1450)).toBe(50);
    });

    it("returns 0 when action cap fully spent", () => {
      expect(service.applyDailyCap(75, 500, 0)).toBe(0);
    });

    it("returns 0 when grand cap fully spent", () => {
      expect(service.applyDailyCap(75, 0, 1500)).toBe(0);
    });

    it("picks tighter cap when grand is more restrictive", () => {
      expect(service.applyDailyCap(75, 480, 1490)).toBe(10);
    });

    it("respects custom action cap", () => {
      expect(service.applyDailyCap(100, 0, 0, 50)).toBe(50);
    });

    it("respects custom grand cap", () => {
      expect(service.applyDailyCap(100, 0, 0, 500, 80)).toBe(80);
    });
  });

  describe("calculateFinalXp", () => {
    const weekday = new Date("2026-03-16T12:00:00Z");
    const saturday = new Date("2026-03-14T12:00:00Z");

    it("returns base XP with no multipliers", () => {
      expect(service.calculateFinalXp(75, 0, weekday)).toBe(75);
    });

    it("applies streak multiplier (floor(75 * 1.5) = 112)", () => {
      expect(service.calculateFinalXp(75, 7, weekday)).toBe(112);
    });

    it("applies both multipliers (floor(75 * 2.0 * 1.1) = 165)", () => {
      expect(service.calculateFinalXp(75, 30, saturday)).toBe(165);
    });

    it("returns 0 when base is 0 regardless of multipliers", () => {
      expect(service.calculateFinalXp(0, 30, saturday)).toBe(0);
    });

    it("floors fractional results", () => {
      expect(service.calculateFinalXp(10, 3, weekday)).toBe(12);
    });
  });

  describe("calculateLevel", () => {
    it.each([
      [0, 1],
      [249, 1],
      [250, 2],
      [750, 3],
      [2000, 4],
      [5000, 5],
      [10000, 6],
      [18000, 7],
      [30000, 8],
      [45000, 9],
      [64999, 9],
      [65000, 10],
      [100000, 10],
    ])("totalXp=%i returns level %i", (xp, expectedLevel) => {
      expect(service.calculateLevel(xp).level).toBe(expectedLevel);
    });

    it("returns full LevelInfo shape", () => {
      const info = service.calculateLevel(5000);
      expect(info).toEqual({
        level: 5,
        title: "Guild Member",
        tier: "Enthusiast",
        xpRequired: 5000,
      });
    });
  });

  describe("getXpToNextLevel", () => {
    it("at 0 XP needs 250 for next level with 0% progress", () => {
      const result = service.getXpToNextLevel(0);
      expect(result.current.level).toBe(1);
      expect(result.next?.level).toBe(2);
      expect(result.xpNeeded).toBe(250);
      expect(result.progressPercent).toBe(0);
    });

    it("at 125 XP shows 50% progress through level 1", () => {
      const result = service.getXpToNextLevel(125);
      expect(result.current.level).toBe(1);
      expect(result.next?.level).toBe(2);
      expect(result.xpNeeded).toBe(125);
      expect(result.progressPercent).toBe(50);
    });

    it("at max level returns null next and 100% progress", () => {
      const result = service.getXpToNextLevel(65000);
      expect(result.current.level).toBe(10);
      expect(result.next).toBeNull();
      expect(result.xpNeeded).toBe(0);
      expect(result.progressPercent).toBe(100);
    });

    it("at exactly level 2 boundary returns 0% of level 2", () => {
      const result = service.getXpToNextLevel(250);
      expect(result.current.level).toBe(2);
      expect(result.next?.level).toBe(3);
      expect(result.xpNeeded).toBe(500);
      expect(result.progressPercent).toBe(0);
    });

    it("well above max level still returns level 10 at 100%", () => {
      const result = service.getXpToNextLevel(999999);
      expect(result.current.level).toBe(10);
      expect(result.next).toBeNull();
      expect(result.progressPercent).toBe(100);
    });
  });

  describe("checkOneTimeBonus", () => {
    it.each([
      ["game_added", true, 100],
      ["event_created", true, 150],
      ["participant_joined", true, 100],
      ["game_added", false, 0],
      ["event_created", false, 0],
      ["participant_joined", false, 0],
    ])('action="%s", isFirst=%s returns %i', (action, isFirst, expected) => {
      expect(service.checkOneTimeBonus(action, isFirst)).toBe(expected);
    });

    it("returns 0 for unknown action even when isFirst", () => {
      expect(service.checkOneTimeBonus("unknown_action", true)).toBe(0);
    });
  });

  describe("isFoundingCollectionEligible", () => {
    const accountCreated = new Date("2026-03-01T00:00:00Z");

    it("returns true for 10+ games within 24h", () => {
      const now = new Date("2026-03-01T23:00:00Z");
      expect(
        service.isFoundingCollectionEligible(accountCreated, 10, now)
      ).toBe(true);
    });

    it("returns false for 9 games within 24h", () => {
      const now = new Date("2026-03-01T23:00:00Z");
      expect(service.isFoundingCollectionEligible(accountCreated, 9, now)).toBe(
        false
      );
    });

    it("returns false for 10+ games after 24h window", () => {
      const now = new Date("2026-03-02T01:00:00Z");
      expect(
        service.isFoundingCollectionEligible(accountCreated, 10, now)
      ).toBe(false);
    });

    it("returns true at exactly 24h boundary", () => {
      const now = new Date("2026-03-02T00:00:00Z");
      expect(
        service.isFoundingCollectionEligible(accountCreated, 10, now)
      ).toBe(true);
    });

    it("returns true for well above threshold within window", () => {
      const now = new Date("2026-03-01T12:00:00Z");
      expect(
        service.isFoundingCollectionEligible(accountCreated, 50, now)
      ).toBe(true);
    });
  });
});
