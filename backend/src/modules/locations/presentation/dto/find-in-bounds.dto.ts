import { z } from "zod";

export const FindInBoundsSchema = z.object({
  swLat: z.coerce.number().min(-90).max(90),
  swLng: z.coerce.number().min(-180).max(180),
  neLat: z.coerce.number().min(-90).max(90),
  neLng: z.coerce.number().min(-180).max(180),
  venueType: z.string().optional(),
});

export type FindInBoundsDto = z.infer<typeof FindInBoundsSchema>;
