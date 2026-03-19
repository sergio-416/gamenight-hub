import { z } from "zod";

export const VENUE_TYPES = [
  "cafe",
  "store",
  "home",
  "public_space",
  "other",
] as const;
export const VenueTypeSchema = z.enum(VENUE_TYPES);
export type VenueType = z.infer<typeof VenueTypeSchema>;

export const LocationSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  venueType: VenueTypeSchema.optional(),
  capacity: z.number().int().min(1).optional(),
  amenities: z.array(z.string()).optional(),
  description: z.string().optional(),
  hostName: z.string().optional(),
  createdBy: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const CreateLocationSchema = z.object({
  name: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  venueType: VenueTypeSchema.optional(),
  capacity: z.number().int().min(1).optional(),
  amenities: z.array(z.string()).optional(),
  description: z.string().optional(),
  hostName: z.string().optional(),
});

export const UpdateLocationSchema = CreateLocationSchema.partial();

export const CreateLocationWithEventSchema = CreateLocationSchema.extend({
  eventDate: z.iso.datetime({ offset: true }).optional(),
});

export type Location = z.infer<typeof LocationSchema>;
export type CreateLocation = z.infer<typeof CreateLocationSchema>;
export type UpdateLocation = z.infer<typeof UpdateLocationSchema>;
export type CreateLocationWithEvent = z.infer<
  typeof CreateLocationWithEventSchema
>;
