import { CacheService } from '@common/cache/cache.service.js';
import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { of } from 'rxjs';
import { BggIntegrationService } from './bgg-integration.service';

describe('BggIntegrationService', () => {
	let service: BggIntegrationService;

	const mockHttpService = {
		get: vi.fn(),
	};

	const mockCacheService = {
		get: vi.fn().mockResolvedValue(null),
		set: vi.fn().mockResolvedValue(undefined),
		del: vi.fn().mockResolvedValue(undefined),
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				BggIntegrationService,
				{
					provide: HttpService,
					useValue: mockHttpService,
				},
				{
					provide: CacheService,
					useValue: mockCacheService,
				},
			],
		}).compile();

		service = module.get<BggIntegrationService>(BggIntegrationService);
	});

	describe('searchGames', () => {
		it('should return board games matching the search query', async () => {
			const mockAxiosResponse: AxiosResponse<string> = {
				data: `<?xml version="1.0" encoding="UTF-8"?>
          <items total="2">
            <item type="boardgame" id="13">
              <name type="primary" value="Catan"/>
              <yearpublished value="1995"/>
            </item>
            <item type="boardgame" id="115746">
              <name type="primary" value="Catan: Seafarers"/>
              <yearpublished value="1997"/>
            </item>
          </items>`,
				status: 200,
				statusText: 'OK',
				headers: {},
				config: {} as InternalAxiosRequestConfig,
			};

			mockHttpService.get.mockReturnValue(of(mockAxiosResponse));

			const results = await service.searchGames('catan');

			expect(results).toHaveLength(2);
			expect(results[0]).toMatchObject({
				bggId: 13,
				name: 'Catan',
				yearPublished: 1995,
			});
			expect(results[1]).toMatchObject({
				bggId: 115746,
				name: 'Catan: Seafarers',
				yearPublished: 1997,
			});
		});

		it('should return empty array when no results found', async () => {
			const mockAxiosResponse: AxiosResponse<string> = {
				data: `<?xml version="1.0" encoding="UTF-8"?>
          <items total="0"></items>`,
				status: 200,
				statusText: 'OK',
				headers: {},
				config: {} as InternalAxiosRequestConfig,
			};

			mockHttpService.get.mockReturnValue(of(mockAxiosResponse));

			const results = await service.searchGames('xyznonexistent');

			expect(results).toEqual([]);
		});

		it('should handle single game result from BGG', async () => {
			const mockAxiosResponse: AxiosResponse<string> = {
				data: `<?xml version="1.0" encoding="UTF-8"?>
          <items total="1">
            <item type="boardgame" id="30549">
              <name type="primary" value="Pandemic"/>
              <yearpublished value="2008"/>
            </item>
          </items>`,
				status: 200,
				statusText: 'OK',
				headers: {},
				config: {} as InternalAxiosRequestConfig,
			};

			mockHttpService.get.mockReturnValue(of(mockAxiosResponse));

			const results = await service.searchGames('pandemic');

			expect(results).toHaveLength(1);
			expect(results[0]).toMatchObject({
				bggId: 30549,
				name: 'Pandemic',
				yearPublished: 2008,
			});
		});

		it('should throw service unavailable when BGG API fails', async () => {
			mockHttpService.get.mockReturnValue(of(Promise.reject(new Error('Network error'))));

			try {
				await service.searchGames('catan');
				expect.fail('Expected HttpException to be thrown');
			} catch (error) {
				expect(error).toBeInstanceOf(HttpException);
				expect((error as HttpException).getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
			}
		}, 10000);
	});

	describe('getGameDetails', () => {
		it('should return detailed game information from BGG', async () => {
			const mockAxiosResponse: AxiosResponse<string> = {
				data: `<?xml version="1.0" encoding="UTF-8"?>
          <items total="1">
            <item type="boardgame" id="13">
              <name type="primary" sortindex="1" value="Catan"/>
              <yearpublished value="1995"/>
              <minplayers value="3"/>
              <maxplayers value="4"/>
              <playingtime value="120"/>
              <minage value="10"/>
              <description>Players try to dominate the island of Catan by building settlements.</description>
              <link type="boardgamecategory" id="1009" value="Strategy"/>
              <link type="boardgamecategory" id="1015" value="Economic"/>
              <link type="boardgamemechanic" id="2007" value="Hand Management"/>
              <link type="boardgamepublisher" id="13" value="KOSMOS"/>
            </item>
          </items>`,
				status: 200,
				statusText: 'OK',
				headers: {},
				config: {} as InternalAxiosRequestConfig,
			};

			mockHttpService.get.mockReturnValue(of(mockAxiosResponse));

			const game = await service.getGameDetails(13);

			expect(game).toMatchObject({
				bggId: 13,
				name: 'Catan',
				yearPublished: 1995,
				minPlayers: 3,
				maxPlayers: 4,
				playingTime: 120,
				minAge: 10,
				description: 'Players try to dominate the island of Catan by building settlements.',
				categories: ['Strategy', 'Economic'],
				mechanics: ['Hand Management'],
				publisher: 'KOSMOS',
			});
		});

		it('should throw not found when game does not exist', async () => {
			const mockAxiosResponse: AxiosResponse<string> = {
				data: `<?xml version="1.0" encoding="UTF-8"?>
          <items total="0"></items>`,
				status: 200,
				statusText: 'OK',
				headers: {},
				config: {} as InternalAxiosRequestConfig,
			};

			mockHttpService.get.mockReturnValue(of(mockAxiosResponse));

			await expect(service.getGameDetails(99999)).rejects.toThrow(HttpException);
		}, 10000);

		it('should return cached data without calling BGG API on cache hit', async () => {
			const cachedGame = {
				bggId: 13,
				name: 'Catan',
				yearPublished: 1995,
				categories: ['Strategy'],
				mechanics: ['Hand Management'],
			};

			mockCacheService.get.mockResolvedValue(cachedGame);

			const result = await service.getGameDetails(13);

			expect(result).toEqual(cachedGame);
			expect(mockCacheService.get).toHaveBeenCalledWith('bgg:game:13');
			expect(mockHttpService.get).not.toHaveBeenCalled();
		});

		it('should cache result after fetching from BGG API on cache miss', async () => {
			mockCacheService.get.mockResolvedValue(null);

			const mockAxiosResponse: AxiosResponse<string> = {
				data: `<?xml version="1.0" encoding="UTF-8"?>
          <items total="1">
            <item type="boardgame" id="13">
              <name type="primary" sortindex="1" value="Catan"/>
              <yearpublished value="1995"/>
              <minplayers value="3"/>
              <maxplayers value="4"/>
              <playingtime value="120"/>
              <minage value="10"/>
              <description>Players try to dominate the island of Catan.</description>
              <link type="boardgamecategory" id="1009" value="Strategy"/>
              <link type="boardgamemechanic" id="2007" value="Hand Management"/>
              <link type="boardgamepublisher" id="13" value="KOSMOS"/>
            </item>
          </items>`,
				status: 200,
				statusText: 'OK',
				headers: {},
				config: {} as InternalAxiosRequestConfig,
			};

			mockHttpService.get.mockReturnValue(of(mockAxiosResponse));

			const result = await service.getGameDetails(13);

			expect(result.name).toBe('Catan');
			expect(mockCacheService.set).toHaveBeenCalledWith(
				'bgg:game:13',
				expect.objectContaining({ bggId: 13, name: 'Catan' }),
				86400,
			);
		});
	});
});
