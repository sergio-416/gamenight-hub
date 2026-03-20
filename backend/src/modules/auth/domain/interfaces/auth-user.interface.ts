import type { UserRole, UserType } from '@gamenight-hub/shared';

export interface AuthUser {
	uid: string;
	email: string;
	emailVerified: boolean;
	role: UserRole;
	userType: UserType;
}
