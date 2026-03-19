import { z } from "zod";

export const XP_ACTIONS = [
  "game_added",
  "event_created",
  "participant_joined",
] as const;

export const xpActionSchema = z.enum(XP_ACTIONS);

export const xpProfileResponseSchema = z.object({
  userId: z.string(),
  xpTotal: z.number().int(),
  level: z.number().int(),
  streakWeeks: z.number().int(),
  lastActivityAt: z.coerce.date().nullable(),
  levelTitle: z.string(),
  nextLevelXp: z.number().int(),
  xpToNextLevel: z.number().int(),
  progressPercent: z.number(),
});

export const xpTransactionResponseSchema = z.object({
  id: z.uuid(),
  action: xpActionSchema,
  baseXp: z.number().int(),
  multiplier: z.number(),
  finalXp: z.number().int(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.coerce.date(),
});

export const xpHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const xpStatsResponseSchema = z.object({
  monthlyXp: z.number().int(),
  weeklyXp: z.number().int(),
  totalTransactions: z.number().int(),
  currentStreak: z.number().int(),
  longestStreak: z.number().int(),
  topAction: xpActionSchema.nullable(),
});

export type XpProfileResponse = z.infer<typeof xpProfileResponseSchema>;
export type XpTransactionResponse = z.infer<typeof xpTransactionResponseSchema>;
export type XpHistoryQuery = z.infer<typeof xpHistoryQuerySchema>;
export type XpStatsResponse = z.infer<typeof xpStatsResponseSchema>;
