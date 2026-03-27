import { z } from 'zod';
import { PROFILE_CONSTRAINTS } from '../constants/validation.js';

export const UpdateProfileSchema = z.object({
	firstName: z
		.string()
		.min(PROFILE_CONSTRAINTS.FIRST_NAME_MIN, 'First name is required')
		.max(PROFILE_CONSTRAINTS.FIRST_NAME_MAX, 'First name must be at most 50 characters')
		.optional(),
	lastName: z
		.string()
		.min(PROFILE_CONSTRAINTS.LAST_NAME_MIN, 'Last name is required')
		.max(PROFILE_CONSTRAINTS.LAST_NAME_MAX, 'Last name must be at most 50 characters')
		.optional(),

	username: z
		.string()
		.min(PROFILE_CONSTRAINTS.USERNAME_MIN, 'Username must be at least 3 characters')
		.max(PROFILE_CONSTRAINTS.USERNAME_MAX, 'Username must be at most 30 characters')
		.optional(),

	email: z.email('Must be a valid email').optional().or(z.literal('')),
	backupEmail: z.email('Must be a valid email').optional().or(z.literal('')),
	mobilePhone: z
		.string()
		.regex(/^\+?[0-9]{9,15}$/, 'Must be a valid phone number')
		.optional()
		.or(z.literal('')),

	location: z.string().max(PROFILE_CONSTRAINTS.LOCATION_MAX, 'Location must be at most 100 characters').optional(),
	postalZip: z
		.string()
		.regex(/^[0-9]{4,10}$/, 'Must be a valid postal code')
		.optional()
		.or(z.literal('')),

	birthday: z.string().optional(),
	bio: z.string().max(PROFILE_CONSTRAINTS.BIO_MAX, 'Bio must be at most 300 characters').optional(),

	avatar: z.url({ message: 'Avatar must be a valid URL' }).optional(),

	isProfilePublic: z.boolean().optional(),
	useRealNameForContact: z.boolean().optional(),
	showFirstName: z.boolean().optional(),
	showLastName: z.boolean().optional(),
	showLocation: z.boolean().optional(),
	showPostalZip: z.boolean().optional(),
	showBirthday: z.boolean().optional(),
	showMobilePhone: z.boolean().optional(),
	showBackupEmail: z.boolean().optional(),
	showEmail: z.boolean().optional(),
	showGameCollection: z.boolean().optional(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;

export interface Profile {
	uid: string;
	firstName: string | null;
	lastName: string | null;
	username: string | null;
	email: string | null;
	backupEmail: string | null;
	mobilePhone: string | null;
	avatar: string | null;
	bio: string | null;
	location: string | null;
	postalZip: string | null;
	birthday: string | null;
	isProfilePublic: boolean;
	useRealNameForContact: boolean;
	showFirstName: boolean;
	showLastName: boolean;
	showLocation: boolean;
	showPostalZip: boolean;
	showBirthday: boolean;
	showMobilePhone: boolean;
	showBackupEmail: boolean;
	showEmail: boolean;
	showGameCollection: boolean;
	nameChangedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface PublicProfile {
	username: string | null;
	firstName: string | null;
	lastName: string | null;
	avatar: string | null;
	bio: string | null;
	location: string | null;
	email: string | null;
	mobilePhone: string | null;
	birthday: string | null;
	backupEmail: string | null;
	isProfilePublic: boolean;
	showGameCollection: boolean;
	createdAt: Date;
}

export interface PublicProfileGamesResponse {
	data: Array<{
		id: string;
		name: string;
		bggId: number | null;
		thumbnailUrl: string | null;
		imageUrl: string | null;
		yearPublished: number | null;
		minPlayers: number | null;
		maxPlayers: number | null;
		playingTime: number | null;
		status: string;
		isExpansion: boolean;
	}>;
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface PublicXpResponse {
	level: number;
	levelTitle: string;
	xpTotal: number;
	nextLevelXp: number;
	progressPercent: number;
	streakWeeks: number;
}
