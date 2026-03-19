import { z } from "zod";

export const GeocodeSchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

export type GeocodeDto = z.infer<typeof GeocodeSchema>;
