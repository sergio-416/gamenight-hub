import { z } from 'zod';

export const EnvSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	PORT: z.coerce.number().int().min(1).max(65535).default(3000),
	POSTGRES_URL: z.string().min(1, 'POSTGRES_URL is required'),
	REDIS_URL: z.string().min(1).optional(),
	FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
	FIREBASE_PRIVATE_KEY: z.string().min(1, 'FIREBASE_PRIVATE_KEY is required'),
	FIREBASE_CLIENT_EMAIL: z.email({
		message: 'FIREBASE_CLIENT_EMAIL must be a valid email',
	}),
	FRONTEND_URL: z.url().default('http://localhost:4200'),
	BGG_API_TOKEN: z.string().optional(),
	GOOGLE_GENAI_API_KEY: z.string().optional(),
	ENABLE_SWAGGER: z.enum(['true', 'false']).optional().default('false'),
	RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
	EMAIL_FROM: z
		.email({ message: 'EMAIL_FROM must be a valid email' })
		.default('onboarding@resend.dev'),
});

export type Env = z.infer<typeof EnvSchema>;
