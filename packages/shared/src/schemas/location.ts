import { z } from 'zod';
import { GEO, LOCATION_CONSTRAINTS } from '../constants/validation.js';

export const VENUE_TYPES = ['cafe', 'store', 'home', 'public_space', 'other'] as const;
export const VenueTypeSchema = z.enum(VENUE_TYPES);
export type VenueType = z.infer<typeof VenueTypeSchema>;

export const LocationSchema = z.object({
	id: z.uuid(),
	name: z.string().min(1),
	latitude: z.number().min(GEO.LAT_MIN).max(GEO.LAT_MAX),
	longitude: z.number().min(GEO.LON_MIN).max(GEO.LON_MAX),
	address: z.string().optional(),
	postalCode: z.string().optional(),
	venueType: VenueTypeSchema.optional(),
	capacity: z.number().int().min(LOCATION_CONSTRAINTS.CAPACITY_MIN).optional(),
	amenities: z.array(z.string()).optional(),
	description: z.string().optional(),
	hostName: z.string().optional(),
	createdBy: z.string().optional(),
	createdAt: z.coerce.date().optional(),
	updatedAt: z.coerce.date().optional(),
});

export const CreateLocationSchema = z.object({
	name: z.string().min(1),
	latitude: z.number().min(GEO.LAT_MIN).max(GEO.LAT_MAX),
	longitude: z.number().min(GEO.LON_MIN).max(GEO.LON_MAX),
	address: z.string().optional(),
	postalCode: z.string().optional(),
	venueType: VenueTypeSchema.optional(),
	capacity: z.number().int().min(LOCATION_CONSTRAINTS.CAPACITY_MIN).optional(),
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
export type CreateLocationWithEvent = z.infer<typeof CreateLocationWithEventSchema>;
