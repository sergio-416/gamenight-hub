import { Injectable } from "@nestjs/common";

export interface LevelInfo {
  level: number;
  title: string;
  tier: string;
  xpRequired: number;
}

export interface LevelProgress {
  current: LevelInfo;
  next: LevelInfo | null;
  xpNeeded: number;
  progressPercent: number;
}

const LEVEL_TABLE: readonly LevelInfo[] = [
  { level: 1, title: "Wandering Pawn", tier: "Novice", xpRequired: 0 },
  { level: 2, title: "Curious Collector", tier: "Novice", xpRequired: 250 },
  { level: 3, title: "Apprentice Archivist", tier: "Novice", xpRequired: 750 },
  { level: 4, title: "Tavern Regular", tier: "Enthusiast", xpRequired: 2000 },
  { level: 5, title: "Guild Member", tier: "Enthusiast", xpRequired: 5000 },
  {
    level: 6,
    title: "Seasoned Strategist",
    tier: "Enthusiast",
    xpRequired: 10000,
  },
  { level: 7, title: "Lorekeeper", tier: "Veteran", xpRequired: 18000 },
  {
    level: 8,
    title: "Knight of the Table",
    tier: "Veteran",
    xpRequired: 30000,
  },
  { level: 9, title: "High Chamberlain", tier: "Veteran", xpRequired: 45000 },
  {
    level: 10,
    title: "Archmage of the Table",
    tier: "Legendary",
    xpRequired: 65000,
  },
] as const;

const ACTION_CAP = 500;
const GRAND_CAP = 1500;

const ONE_TIME_BONUSES: Record<string, number> = {
  game_added: 100,
  event_created: 150,
  participant_joined: 100,
};

const FOUNDING_COLLECTION_BONUS = 150;
const FOUNDING_COLLECTION_THRESHOLD = 10;
const FOUNDING_COLLECTION_WINDOW_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class XpCalculatorService {
  static readonly LEVEL_TABLE = LEVEL_TABLE;

  calculateGameXp(monthlyCount: number): number {
    if (monthlyCount < 5) return 75;
    if (monthlyCount < 15) return 20;
    if (monthlyCount < 30) return 10;
    return 5;
  }

  calculateSoloBonus(monthlyCount: number, batchSize: number): number {
    return monthlyCount === 0 && batchSize === 1 ? 25 : 0;
  }

  calculateBatchGameXp(monthlyCount: number, batchSize: number): number[] {
    const results: number[] = [];
    let current = monthlyCount;
    for (let i = 0; i < batchSize; i++) {
      results.push(this.calculateGameXp(current));
      current++;
    }
    return results;
  }

  getStreakMultiplier(streakWeeks: number): number {
    if (streakWeeks >= 30) return 2.0;
    if (streakWeeks >= 7) return 1.5;
    if (streakWeeks >= 3) return 1.25;
    return 1.0;
  }

  getWeekendMultiplier(date: Date): number {
    const day = date.getUTCDay();
    return day === 0 || day === 6 ? 1.1 : 1.0;
  }

  getCombinedMultiplier(streakWeeks: number, date: Date): number {
    return (
      this.getStreakMultiplier(streakWeeks) * this.getWeekendMultiplier(date)
    );
  }

  applyDailyCap(
    baseXp: number,
    dailyActionSpent: number,
    dailyGrandSpent: number,
    actionCap: number = ACTION_CAP,
    grandCap: number = GRAND_CAP
  ): number {
    const remainingAction = Math.max(0, actionCap - dailyActionSpent);
    const remainingGrand = Math.max(0, grandCap - dailyGrandSpent);
    return Math.min(baseXp, remainingAction, remainingGrand);
  }

  calculateFinalXp(
    cappedBaseXp: number,
    streakWeeks: number,
    date: Date
  ): number {
    return Math.floor(
      cappedBaseXp * this.getCombinedMultiplier(streakWeeks, date)
    );
  }

  calculateLevel(totalXp: number): LevelInfo {
    for (let i = LEVEL_TABLE.length - 1; i >= 0; i--) {
      if (totalXp >= LEVEL_TABLE[i].xpRequired) {
        return LEVEL_TABLE[i];
      }
    }
    return LEVEL_TABLE[0];
  }

  getXpToNextLevel(totalXp: number): LevelProgress {
    const current = this.calculateLevel(totalXp);
    const nextIndex = LEVEL_TABLE.findIndex(
      (l) => l.level === current.level + 1
    );

    if (nextIndex === -1) {
      return { current, next: null, xpNeeded: 0, progressPercent: 100 };
    }

    const next = LEVEL_TABLE[nextIndex];
    const xpNeeded = next.xpRequired - totalXp;
    const levelSpan = next.xpRequired - current.xpRequired;
    const progressPercent = Math.floor(
      ((totalXp - current.xpRequired) / levelSpan) * 100
    );

    return { current, next, xpNeeded, progressPercent };
  }

  checkOneTimeBonus(action: string, isFirst: boolean): number {
    if (!isFirst) return 0;
    return ONE_TIME_BONUSES[action] ?? 0;
  }

  isFoundingCollectionEligible(
    accountCreatedAt: Date,
    gameCount: number,
    now: Date
  ): boolean {
    if (gameCount < FOUNDING_COLLECTION_THRESHOLD) return false;
    const elapsed = now.getTime() - accountCreatedAt.getTime();
    return elapsed <= FOUNDING_COLLECTION_WINDOW_MS;
  }
}
