import { DB_TOKEN, type DrizzleDb } from '@database/database.module.js';
import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { sql } from 'drizzle-orm';

@ApiTags('Health')
@Controller({ path: 'health', version: '1' })
@SkipThrottle()
export class HealthController {
	readonly #db: DrizzleDb;

	constructor(@Inject(DB_TOKEN) db: DrizzleDb) {
		this.#db = db;
	}

	@ApiOperation({ summary: 'Liveness check with database ping' })
	@Get()
	async check() {
		await this.#db.execute(sql`SELECT 1`);
		return { status: 'ok', postgres: 'up' };
	}

	@ApiOperation({ summary: 'Readiness check with database ping' })
	@Get('ready')
	async ready() {
		await this.#db.execute(sql`SELECT 1`);
		return { status: 'ok', postgres: 'up' };
	}
}
