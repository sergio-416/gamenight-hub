import { provideHttpClient } from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ApplicationRef, provideZonelessChangeDetection } from "@angular/core";
import { API_CONFIG } from "@core/config/api.config";
import { provideTranslocoTesting } from "@core/testing/transloco-testing";
import {
	fireEvent,
	type RenderResult,
	render,
	screen,
} from "@testing-library/angular";
import type { Game } from "../../models/game.model";
import { GameList } from "./game-list";

describe("GameList", () => {
	let fixture: RenderResult<GameList>["fixture"];
	let httpTesting: HttpTestingController;

	const mockGames: Game[] = [
		{
			id: "1",
			name: "Catan",
			bggId: 13,
			status: "owned",
			yearPublished: 1995,
			minPlayers: 3,
			maxPlayers: 4,
			playingTime: 120,
			categories: ["Strategy", "Economic"],
			createdAt: new Date("2026-03-01"),
		},
		{
			id: "2",
			name: "Ticket to Ride",
			bggId: 42,
			status: "want_to_play",
			yearPublished: 2004,
			minPlayers: 2,
			maxPlayers: 5,
			playingTime: 60,
			categories: ["Family Game", "Strategy"],
			createdAt: new Date("2026-03-10"),
		},
	];

	const gamesUrl = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.games}`;

	async function setup(isLoggedIn = true) {
		const rendered = await render<GameList>(GameList, {
			componentInputs: { isLoggedIn },
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				provideZonelessChangeDetection(),
				provideTranslocoTesting(),
			],
		});

		fixture = rendered.fixture;
		httpTesting = fixture.debugElement.injector.get(HttpTestingController);
		return rendered;
	}

	async function stabilize(): Promise<void> {
		await fixture.debugElement.injector.get(ApplicationRef).whenStable();
		fixture.detectChanges();
	}

	afterEach(() => {
		httpTesting.verify();
		vi.clearAllMocks();
		localStorage.removeItem("collection-view-mode");
	});

	function paginateGames(games: Game[]) {
		return {
			data: games,
			total: games.length,
			page: 1,
			limit: 20,
			totalPages: 1,
		};
	}

	async function loadGames(games: Game[] = mockGames): Promise<void> {
		fixture.detectChanges();
		const req = httpTesting.expectOne(gamesUrl);
		req.flush(paginateGames(games));
		await fixture.debugElement.injector.get(ApplicationRef).whenStable();
		fixture.detectChanges();
	}

	describe("loading state", () => {
		it("should show skeleton grid while loading", async () => {
			await setup();
			fixture.detectChanges();

			const skeletons = document.querySelectorAll(".animate-pulse");
			expect(skeletons.length).toBe(8);

			const req = httpTesting.expectOne(gamesUrl);
			req.flush(paginateGames([]));
		});

		it("should hide skeleton after games load", async () => {
			await setup();
			await loadGames();

			const skeletons = document.querySelectorAll(".animate-pulse");
			expect(skeletons.length).toBe(0);
		});
	});

	describe("empty state", () => {
		it("should show empty collection message when no games exist", async () => {
			await setup();
			await loadGames([]);

			expect(screen.getByText(/Your collection is empty/)).toBeTruthy();
			expect(
				screen.getByText(/Start building your tabletop library/),
			).toBeTruthy();
		});

		it("should show import button in empty state when logged in", async () => {
			await setup(true);
			await loadGames([]);

			expect(screen.getByText(/Import your first game/)).toBeTruthy();
		});

		it("should not show import button in empty state when logged out", async () => {
			await setup(false);
			await loadGames([]);

			expect(screen.queryByText(/Import your first game/)).toBeFalsy();
		});

		it("should show filter message when filters active but no results", async () => {
			await setup();
			await loadGames(mockGames);

			const searchInput = screen.getByRole("textbox", {
				name: /Search games in collection/,
			});
			fireEvent.input(searchInput, { target: { value: "nonexistent" } });
			fixture.detectChanges();

			expect(screen.getByText(/No games found/)).toBeTruthy();
			expect(
				screen.getByText(/Try adjusting your search or filters/),
			).toBeTruthy();
		});
	});

	describe("display games", () => {
		it("should render game cards in grid view", async () => {
			await setup();
			await loadGames();

			const cards = document.querySelectorAll("app-game-card");
			expect(cards.length).toBe(2);
			expect(screen.getByText(/Catan/)).toBeTruthy();
			expect(screen.getByText(/Ticket to Ride/)).toBeTruthy();
		});

		it("should render CollectionHeader with total count", async () => {
			await setup();
			await loadGames();

			expect(screen.getByText(/2 games/)).toBeTruthy();
		});

		it("should render list view when toggled", async () => {
			await setup();
			await loadGames();

			const listButton = screen.getByRole("button", {
				name: /List view/,
			});
			fireEvent.click(listButton);
			fixture.detectChanges();

			const cards = document.querySelectorAll("app-game-card");
			expect(cards.length).toBe(0);
			expect(screen.getByText(/Catan/)).toBeTruthy();
			expect(screen.getByText(/Ticket to Ride/)).toBeTruthy();
		});
	});

	describe("player count filtering", () => {
		it("should filter games by player count", async () => {
			await setup();
			await loadGames();

			fixture.componentInstance.onPlayerFilterChange("2");
			await stabilize();

			const cards = document.querySelectorAll("app-game-card");
			expect(cards.length).toBe(1);
			expect(screen.getByText(/Ticket to Ride/)).toBeTruthy();
			expect(screen.queryByText(/Catan/)).toBeFalsy();
		});

		it("should show all games with any players filter", async () => {
			await setup();
			await loadGames();

			fixture.componentInstance.onPlayerFilterChange("3");
			await stabilize();
			fixture.componentInstance.onPlayerFilterChange("any");
			await stabilize();

			const cards = document.querySelectorAll("app-game-card");
			expect(cards.length).toBe(2);
		});
	});

	describe("category filtering", () => {
		it("should filter games by category", async () => {
			await setup();
			await loadGames();

			fixture.componentInstance.onCategoryFilterChange("Family Game");
			await stabilize();

			const cards = document.querySelectorAll("app-game-card");
			expect(cards.length).toBe(1);
			expect(screen.getByText(/Ticket to Ride/)).toBeTruthy();
		});

		it("should derive available categories from loaded games", async () => {
			await setup();
			await loadGames();

			const cats = fixture.componentInstance.availableCategories();
			expect(cats).toEqual(["Economic", "Family Game", "Strategy"]);
		});
	});

	describe("sorting", () => {
		it("should sort games A-Z by default", async () => {
			await setup();
			await loadGames();

			const displayed = fixture.componentInstance.displayedGames();
			expect(displayed[0].name).toBe("Catan");
			expect(displayed[1].name).toBe("Ticket to Ride");
		});

		it("should sort games Z-A", async () => {
			await setup();
			await loadGames();

			fixture.componentInstance.onSortChange("name_desc");
			await stabilize();

			const displayed = fixture.componentInstance.displayedGames();
			expect(displayed[0].name).toBe("Ticket to Ride");
			expect(displayed[1].name).toBe("Catan");
		});

		it("should sort by newest first", async () => {
			await setup();
			await loadGames();

			fixture.componentInstance.onSortChange("newest");
			await stabilize();

			const displayed = fixture.componentInstance.displayedGames();
			expect(displayed[0].name).toBe("Ticket to Ride");
		});
	});

	describe("search filtering", () => {
		it("should filter games by search query", async () => {
			await setup();
			await loadGames();

			fixture.componentInstance.onSearchChange("catan");
			await stabilize();

			const cards = document.querySelectorAll("app-game-card");
			expect(cards.length).toBe(1);
			expect(screen.getByText(/Catan/)).toBeTruthy();
		});
	});

	describe("load more", () => {
		it("should show Load More button when more games available", async () => {
			await setup();
			const manyGames = Array.from({ length: 15 }, (_, i) => ({
				id: String(i),
				name: `Game ${i}`,
				bggId: i,
				status: "owned" as const,
				yearPublished: 2020,
			}));
			await loadGames(manyGames);

			expect(screen.getByText(/Load More Games/)).toBeTruthy();
		});

		it("should not show Load More when all games displayed", async () => {
			await setup();
			await loadGames();

			expect(screen.queryByText(/Load More Games/)).toBeFalsy();
		});
	});

	describe("deleting games (list view)", () => {
		beforeEach(async () => {
			await setup(true);
			await loadGames();

			const listButton = screen.getByRole("button", {
				name: /List view/,
			});
			fireEvent.click(listButton);
			fixture.detectChanges();
		});

		it("should show confirmation dialog when delete button is clicked", () => {
			expect(screen.queryByTestId("confirm-dialog")).toBeFalsy();

			const deleteButtons = document.querySelectorAll(
				"button.hover\\:text-red-400",
			);
			fireEvent.click(deleteButtons[0]);
			fixture.detectChanges();

			expect(screen.getByTestId("confirm-dialog")).toBeTruthy();
		});

		it("should display confirmation message in dialog", () => {
			const deleteButtons = document.querySelectorAll(
				"button.hover\\:text-red-400",
			);
			fireEvent.click(deleteButtons[0]);
			fixture.detectChanges();

			expect(
				screen.getByText(/Are you sure you want to remove this game/),
			).toBeTruthy();
		});

		it("should close dialog when cancel button is clicked", () => {
			const deleteButtons = document.querySelectorAll(
				"button.hover\\:text-red-400",
			);
			fireEvent.click(deleteButtons[0]);
			fixture.detectChanges();

			const cancelButton = screen.getByTestId("cancel-button");
			fireEvent.click(cancelButton);
			fixture.detectChanges();

			expect(screen.queryByTestId("confirm-dialog")).toBeFalsy();
		});

		it("should emit gameDeleted when user confirms deletion", () => {
			const gameDeletedSpy = vi.fn();
			fixture.componentInstance.gameDeleted.subscribe(gameDeletedSpy);

			const deleteButtons = document.querySelectorAll(
				"button.hover\\:text-red-400",
			);
			fireEvent.click(deleteButtons[0]);
			fixture.detectChanges();

			const confirmButton = screen.getByTestId("confirm-button");
			fireEvent.click(confirmButton);
			fixture.detectChanges();

			expect(gameDeletedSpy).toHaveBeenCalledWith("1");
		});

		it("should not show delete button when user is not authenticated", async () => {
			fixture.componentRef.setInput("isLoggedIn", false);
			fixture.detectChanges();

			const deleteButtons = document.querySelectorAll(
				"button.hover\\:text-red-400",
			);
			expect(deleteButtons.length).toBe(0);
		});
	});
});
