import { existsSync } from 'node:fs';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { DB_TOKEN, type DrizzleDb } from '@database/database.module.js';
import { bggGames, type InsertBggGame } from '@database/schema/bgg-games.js';
import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { sql } from 'drizzle-orm';
import MiniSearch from 'minisearch';
import type { BggGameRank } from '../domain/entities/bgg-game-rank.entity.js';
import type { GameSearchResult } from '../domain/entities/game-search-result.entity.js';

function normaliseName(name: string): string {
	return name
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/\b(the|a|an|das|der|die|les|le|la|el|los|las)\b/gi, '')
		.replace(/[^\w\s]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

const SYNC_BATCH_SIZE = 500;

@Injectable()
export class BggCsvService implements OnModuleInit {
	readonly #logger = new Logger(BggCsvService.name);
	readonly #games: BggGameRank[] = [];
	readonly #maxSearchResults = 50;
	#searchIndex!: MiniSearch;
	#loaded = false;

	constructor(@Inject(DB_TOKEN) private readonly db: DrizzleDb) {}

	async onModuleInit(): Promise<void> {
		if (!this.#loaded) {
			await this.#loadCsvData();

			const enrichedGames = this.#games.map((game) => {
				const norm = normaliseName(game.name);
				return {
					...game,
					nameNorm: norm,
					nameCompact: norm.replace(/\s+/g, ''),
				};
			});

			this.#searchIndex = new MiniSearch({
				fields: ['name', 'nameNorm', 'nameCompact'],
				storeFields: ['name', 'yearpublished', 'rank', 'average', 'id', 'is_expansion'],
				idField: 'id',
				searchOptions: {
					prefix: true,
					fuzzy: 0.2,
					combineWith: 'AND',
					boost: { nameNorm: 2, nameCompact: 1.5 },
					boostDocument: (_id: string, _term: string, storedFields: Record<string, unknown>) => {
						const rank = parseInt(storedFields.rank as string, 10);
						if (Number.isNaN(rank) || rank <= 0) return 0.5;
						return 1 + 10 / Math.log2(rank + 2);
					},
				},
			});

			this.#searchIndex.addAll(enrichedGames);

			this.#loaded = true;
			void this.#syncToDatabase();
		}
	}

	async #syncToDatabase(): Promise<void> {
		if (this.#games.length === 0) return;

		try {
			const existing = await this.db.select({ count: sql<number>`count(*)` }).from(bggGames);
			const rowCount = Number(existing[0].count);

			if (rowCount > 0) {
				this.#logger.log(`bgg_games table already has ${rowCount} rows — skipping sync`);
				return;
			}

			const rows: InsertBggGame[] = this.#games
				.filter((g) => g.rank && g.rank !== 'Not Ranked')
				.map((g) => ({
					id: parseInt(g.id, 10),
					name: g.name,
					rank: parseInt(g.rank, 10) || null,
					avgRating: g.average ? parseFloat(g.average).toFixed(2) : null,
					yearPublished: g.yearpublished ? parseInt(g.yearpublished, 10) : null,
					geekRating: g.bayesaverage ? parseFloat(g.bayesaverage).toFixed(2) : null,
					isExpansion: g.is_expansion === '1',
				}));

			let inserted = 0;
			for (let i = 0; i < rows.length; i += SYNC_BATCH_SIZE) {
				const batch = rows.slice(i, i + SYNC_BATCH_SIZE);
				await this.db.insert(bggGames).values(batch).onConflictDoNothing();
				inserted += batch.length;
			}

			this.#logger.log(`Synced ${inserted} BGG games to PostgreSQL`);
		} catch (error) {
			this.#logger.error('Failed to sync BGG CSV data to database', error);
		}
	}

	#getCsvPath(): string | undefined {
		const candidates = [
			path.resolve(process.cwd(), 'data', 'bgg_ranks_02_26.csv'),
			path.resolve(process.cwd(), 'backend', 'data', 'bgg_ranks_02_26.csv'),
		];

		return candidates.find((c) => existsSync(c));
	}

	#mapCsvRecordToBggGameRank(record: Record<string, string>): BggGameRank | null {
		const requiredFields = [
			'id',
			'name',
			'yearpublished',
			'rank',
			'bayesaverage',
			'average',
			'usersrated',
			'is_expansion',
		];

		for (const field of requiredFields) {
			if (!(field in record) || record[field] === undefined) {
				this.#logger.warn(`Missing required field: ${field} in record`);
				return null;
			}
		}

		const bggGameRank: BggGameRank = {
			id: record.id,
			name: record.name,
			yearpublished: record.yearpublished,
			rank: record.rank,
			bayesaverage: record.bayesaverage,
			average: record.average,
			usersrated: record.usersrated,
			is_expansion: record.is_expansion,
		};

		if (record.abstracts_rank) {
			bggGameRank.abstracts_rank = record.abstracts_rank;
		}
		if (record.cgs_rank) {
			bggGameRank.cgs_rank = record.cgs_rank;
		}
		if (record.childrensgames_rank) {
			bggGameRank.childrensgames_rank = record.childrensgames_rank;
		}
		if (record.familygames_rank) {
			bggGameRank.familygames_rank = record.familygames_rank;
		}
		if (record.partygames_rank) {
			bggGameRank.partygames_rank = record.partygames_rank;
		}
		if (record.strategygames_rank) {
			bggGameRank.strategygames_rank = record.strategygames_rank;
		}
		if (record.thematic_rank) {
			bggGameRank.thematic_rank = record.thematic_rank;
		}
		if (record.wargames_rank) {
			bggGameRank.wargames_rank = record.wargames_rank;
		}

		return bggGameRank;
	}

	async #loadCsvData(): Promise<void> {
		const csvPath = this.#getCsvPath();

		if (!csvPath) {
			this.#logger.warn('BGG CSV file not found in any candidate path');
			return;
		}

		try {
			const csvContent = await fs.readFile(csvPath, 'utf-8');
			const records = parse(csvContent, {
				columns: true,
				skip_empty_lines: true,
				trim: true,
			});

			let skippedRecords = 0;
			for (const record of records as Record<string, string>[]) {
				const mappedGame = this.#mapCsvRecordToBggGameRank(record);
				if (mappedGame) {
					this.#games.push(mappedGame);
				} else {
					skippedRecords++;
				}
			}

			this.#logger.log(`Loaded ${this.#games.length} games from CSV`);
			if (skippedRecords > 0) {
				this.#logger.warn(`Skipped ${skippedRecords} invalid records`);
			}
		} catch (error) {
			this.#logger.warn(`CSV file not found or unreadable at ${csvPath}`);
			this.#logger.error('Failed to load CSV data', error);
		}
	}

	search(query: string): GameSearchResult[] {
		if (!query || query.trim().length === 0) return [];

		const normalised = normaliseName(query);
		if (!normalised) return [];
		const compact = normalised.replace(/\s+/g, '');

		let results = this.#searchIndex.search(normalised, {
			fuzzy: false,
			prefix: true,
		});

		if (results.length < 5) {
			results = this.#searchIndex.search(normalised, {
				fuzzy: 0.3,
				prefix: true,
			});
		}

		if (compact !== normalised) {
			const compactResults = this.#searchIndex.search(compact, {
				fuzzy: 0.3,
				prefix: true,
			});
			const seen = new Set(results.map((r) => r.id));
			for (const r of compactResults) {
				if (!seen.has(r.id)) {
					results.push(r);
					seen.add(r.id);
				}
			}
			results.sort((a, b) => b.score - a.score);
		}

		if (results.length > 1) {
			const topScore = results[0].score;
			results = results.filter((r) => r.score >= topScore * 0.3);
		}

		return results.slice(0, this.#maxSearchResults).map((result) => ({
			bggId: parseInt(result.id as string, 10),
			name: result.name as string,
			yearPublished: result.yearpublished
				? parseInt(result.yearpublished as string, 10)
				: undefined,
			rank: result.rank !== 'Not Ranked' ? (result.rank as string) : undefined,
			avgRating: (result.average as string) || undefined,
			isExpansion: result.is_expansion === '1',
			source: 'local' as const,
		}));
	}
}
