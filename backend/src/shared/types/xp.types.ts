import type { XP_ACTIONS } from "../schemas/xp.schema.js";

export type XpAction = (typeof XP_ACTIONS)[number];

export interface XpProfile {
  userId: string;
  xpTotal: number;
  level: number;
  streakWeeks: number;
  lastActivityAt: Date | null;
  levelTitle: string;
  nextLevelXp: number;
  xpToNextLevel: number;
  progressPercent: number;
}

export interface XpTransaction {
  id: string;
  action: XpAction;
  baseXp: number;
  multiplier: number;
  finalXp: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface XpAwardResult {
  awarded: boolean;
  transaction?: XpTransaction;
  levelUp?: boolean;
  newLevel?: number;
  xpAwarded: number;
  reason?: string;
}

export interface LevelInfo {
  level: number;
  title: string;
  tier: string;
  xpRequired: number;
  xpToNext: number;
}

export interface XpEventPayload {
  userId: string;
  action: XpAction;
  xpAwarded: number;
  newTotal: number;
  levelUp?: boolean;
  newLevel?: number;
}
