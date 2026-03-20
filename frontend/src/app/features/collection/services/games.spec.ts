import { provideHttpClient } from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { API_CONFIG } from "@core/config/api.config";
import type {
	Game,
	GameSearchResult,
	PersonalFields,
} from "../models/game.model";
import { GamesService } from "./games";

describe("GamesService", () => {
	let service: GamesService;
	let httpMock: HttpTestingController;

	const apiUrl = API_CONFIG.baseUrl;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				GamesService,
				provideHttpClient(),
				provideHttpClientTesting(),
			],
		});
		service = TestBed.inject(GamesService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock
			.match(() => true)
			.forEach((r) => {
				r.flush([]);
			});
		httpMock.verify();
	});

	describe("ownedBggIds", () => {
		it("should expose an empty set initially", () => {
			expect(service.ownedBggIds().size).toBe(0);
		});
	});

	describe("search", () => {
		it("should return unified search results", () => {
			const mockResults: GameSearchResult[] = [
				{
					bggId: 13,
					name: "Catan",
					yearPublished: 1995,
					rank: "1",
					source: "local",
				},
			];

			service.search("catan").subscribe((results: GameSearchResult[]) => {
				expect(results).toEqual(mockResults);
			});

			const req = httpMock.expectOne(
				`${apiUrl}${API_CONFIG.endpoints.search}?query=catan`,
			);
			expect(req.request.method).toBe("GET");
			req.flush(mockResults);
		});
	});

	describe("importGame", () => {
		it("should import game from BGG", () => {
			const mockGame: Game = {
				id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
				bggId: 13,
				name: "Catan",
				status: "owned",
				notes: "My favorite!",
				isExpansion: false,
			};

			const personalFields: PersonalFields = {
				status: "owned",
				notes: "My favorite!",
				complexity: 3,
			};

			service.importGame(13, personalFields).subscribe((game: Game) => {
				expect(game).toEqual(mockGame);
				expect(game.bggId).toBe(13);
			});

			const req = httpMock.expectOne(`${apiUrl}/games/import/13`);
			expect(req.request.method).toBe("POST");
			expect(req.request.body).toEqual(personalFields);
			req.flush(mockGame);
		});
	});
});
