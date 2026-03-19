import * as dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config();

export default defineConfig({
	schema: './src/database/schema/index.ts',
	out: './src/database/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url:
			process.env.POSTGRES_URL ??
			'postgresql://gamenight:gamenight_dev@localhost:5432/gamenight_hub',
	},
});
