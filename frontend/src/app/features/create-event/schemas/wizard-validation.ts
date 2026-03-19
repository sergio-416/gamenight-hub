import { z } from "zod";
import { EventCategorySchema } from "@gamenight-hub/shared";

export const StepGameSchema = z.object({
	title: z.string().min(1, "Title is required").max(100),
	description: z.string().max(500).optional(),
	gameId: z.string().uuid().optional(),
	coverImage: z.string().min(1).max(50).optional(),
	category: EventCategorySchema.optional(),
});

export const StepLocationSchema = z.object({
	locationMode: z.enum(["public", "private"]),
	locationId: z.string().uuid().optional(),
	location: z
		.object({
			name: z.string().min(1),
			address: z.string().optional(),
			postalCode: z.string().optional(),
			latitude: z.number().min(-90).max(90),
			longitude: z.number().min(-180).max(180),
		})
		.optional(),
	startDate: z.string().min(1, "Date is required"),
	startTime: z.string().min(1, "Time is required"),
	endDate: z.string().optional(),
	endTime: z.string().optional(),
});

export const StepPlayersSchema = z.object({
	maxPlayers: z.number().int().min(2).max(100),
});

export type StepGameData = z.infer<typeof StepGameSchema>;
export type StepLocationData = z.infer<typeof StepLocationSchema>;
export type StepPlayersData = z.infer<typeof StepPlayersSchema>;
