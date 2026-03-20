import { z } from 'zod';

export const VerifyTokenSchema = z.object({
	token: z.string().min(1),
});

export type VerifyToken = z.infer<typeof VerifyTokenSchema>;

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 64;

function hasWeakNumberPatterns(password: string): boolean {
	const numbers = password.match(/[0-9]/g);
	if (!numbers || numbers.length < 3) return false;

	const numStr = numbers.join('');

	if (/(?:012|123|234|345|456|567|678|789|890|901)\d*/.test(numStr)) {
		return true;
	}

	if (/(.)\1{2,}/.test(numStr)) {
		return true;
	}

	return false;
}

export const PasswordSchema = z
	.string()
	.min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
	.max(PASSWORD_MAX_LENGTH, `Password must be less than ${PASSWORD_MAX_LENGTH} characters`)
	.refine((pwd) => !hasWeakNumberPatterns(pwd), {
		message: 'Password cannot contain 3+ sequential or repeated numbers',
	})
	.regex(/[a-z]/, 'Password must contain at least one lowercase letter')
	.regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
	.regex(/[0-9]/, 'Password must contain at least one number')
	.regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

export type Password = z.infer<typeof PasswordSchema>;

export type PasswordStrength = 'weak' | 'nice' | 'strong';

export function calculatePasswordStrength(password: string): PasswordStrength {
	const hasWeakPatterns = hasWeakNumberPatterns(password);
	if (hasWeakPatterns) return 'weak';

	const meetsRequirements =
		password.length >= PASSWORD_MIN_LENGTH &&
		/[a-z]/.test(password) &&
		/[A-Z]/.test(password) &&
		/[0-9]/.test(password) &&
		/[^a-zA-Z0-9]/.test(password);

	if (!meetsRequirements) return 'weak';

	const hasUppercase = (password.match(/[A-Z]/g) || []).length;
	const hasSpecial = (password.match(/[^a-zA-Z0-9]/g) || []).length;

	if (hasUppercase >= 2 || hasSpecial >= 2) return 'strong';
	return 'nice';
}

export interface PasswordRequirements {
	hasMinLength: boolean;
	hasLowercase: boolean;
	hasUppercase: boolean;
	hasNumber: boolean;
	hasSpecial: boolean;
	hasNoWeakPatterns: boolean;
}

export function getPasswordRequirements(password: string): PasswordRequirements {
	return {
		hasMinLength: password.length >= PASSWORD_MIN_LENGTH,
		hasLowercase: /[a-z]/.test(password),
		hasUppercase: /[A-Z]/.test(password),
		hasNumber: /[0-9]/.test(password),
		hasSpecial: /[^a-zA-Z0-9]/.test(password),
		hasNoWeakPatterns: !hasWeakNumberPatterns(password),
	};
}

export type UserRole = 'admin' | 'moderator' | 'user';
export type UserType = 'regular' | 'store_organiser';

export interface UserClaims {
	role: UserRole;
	userType: UserType;
}

export const OrganiserRequestSchema = z.object({
	orgName: z.string().min(2, 'Organisation name must be at least 2 characters'),
	address: z.string().min(5, 'Please enter a valid address'),
	email: z.email('Please enter a valid email'),
});

export type OrganiserRequest = z.infer<typeof OrganiserRequestSchema>;

export const MagicLinkRequestSchema = z.object({
	email: z.email('Please enter a valid email address'),
});

export type MagicLinkRequest = z.infer<typeof MagicLinkRequestSchema>;
