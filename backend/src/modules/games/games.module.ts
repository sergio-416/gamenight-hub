import { HTTP_TIMEOUTS } from '@gamenight-hub/shared';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module.js';
import { BggCsvService } from './application/bgg-csv.service.js';
import { BggIntegrationService } from './application/bgg-integration.service.js';
import { GamesService } from './application/games.service.js';
import { GamesAnalyticsService } from './application/games-analytics.service.js';
import { GamesCrudService } from './application/games-crud.service.js';
import { UserPlayedGamesService } from './application/user-played-games.service.js';
import { GamesController } from './presentation/games.controller.js';

@Module({
	controllers: [GamesController],
	providers: [
		GamesService,
		GamesCrudService,
		GamesAnalyticsService,
		BggIntegrationService,
		BggCsvService,
		UserPlayedGamesService,
	],
	imports: [
		HttpModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService) => {
				const token = config.get<string>('BGG_API_TOKEN');
				return {
					headers: {
						'User-Agent': 'GameNightHub/1.0 (https://github.com/gamenight-hub)',
						Accept: 'application/xml, text/xml, */*',
						...(token ? { Authorization: `Bearer ${token}` } : {}),
					},
					timeout: HTTP_TIMEOUTS.BGG_API,
				};
			},
		}),
		AuthModule,
	],
	exports: [GamesService],
})
export class GamesModule {}
