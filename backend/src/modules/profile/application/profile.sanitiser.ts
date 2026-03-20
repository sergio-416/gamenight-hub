import type { SelectProfile } from '@database/schema/profiles.js';

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

export function toPublicProfile(profile: SelectProfile): PublicProfile {
	return {
		username: profile.username,
		firstName: profile.showFirstName ? profile.firstName : null,
		lastName: profile.showLastName ? profile.lastName : null,
		avatar: profile.avatar,
		bio: profile.bio,
		location: profile.showLocation ? profile.location : null,
		email: profile.showEmail ? profile.email : null,
		mobilePhone: profile.showMobilePhone ? profile.mobilePhone : null,
		birthday: profile.showBirthday ? profile.birthday : null,
		backupEmail: profile.showBackupEmail ? profile.backupEmail : null,
		isProfilePublic: profile.isProfilePublic,
		showGameCollection: profile.showGameCollection,
		createdAt: profile.createdAt,
	};
}
