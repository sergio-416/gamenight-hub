import { provideHttpClient } from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting,
} from "@angular/common/http/testing";
import { API_CONFIG } from "@core/config/api.config";
import { provideTranslocoTesting } from "@core/testing/transloco-testing";
import { fireEvent, render, screen, waitFor } from "@testing-library/angular";
import { XpHistory } from "./xp-history";

const baseUrl = API_CONFIG.baseUrl;

function makeHistoryResponse(
	data: Array<{
		id: string;
		action: string;
		baseXp: number;
		multiplier: number;
		finalXp: number;
		metadata: Record<string, unknown>;
		createdAt: string;
	}> = [],
	overrides: { page?: number; totalPages?: number; total?: number } = {},
) {
	return {
		data,
		total: overrides.total ?? data.length,
		page: overrides.page ?? 1,
		limit: 10,
		totalPages: overrides.totalPages ?? 1,
	};
}

async function renderHistory() {
	const result = await render(XpHistory, {
		providers: [
			provideHttpClient(),
			provideHttpClientTesting(),
			provideTranslocoTesting(),
		],
	});

	const httpMock = result.fixture.debugElement.injector.get(
		HttpTestingController,
	);
	return { ...result, httpMock };
}

function flushXpProfileRequests(httpMock: HttpTestingController) {
	httpMock
		.match((r) => r.url === `${baseUrl}/xp/me`)
		.forEach((r) =>
			r.flush({
				userId: "u1",
				xpTotal: 0,
				level: 1,
				streakWeeks: 0,
				lastActivityAt: null,
				levelTitle: "Wandering Pawn",
				nextLevelXp: 100,
				xpToNextLevel: 100,
				progressPercent: 0,
			}),
		);
}

describe("XpHistory", () => {
	it("should show empty state when no transactions", async () => {
		const { httpMock } = await renderHistory();

		httpMock
			.expectOne((r) => r.url === `${baseUrl}/xp/me/history`)
			.flush(makeHistoryResponse());

		await waitFor(() => {
			expect(screen.getByTestId("xp-empty-state")).toBeTruthy();
			expect(
				screen.getByText("No XP earned yet. Start adding games!"),
			).toBeTruthy();
		});

		flushXpProfileRequests(httpMock);
		httpMock.verify();
	});

	it("should render transaction rows", async () => {
		const { httpMock } = await renderHistory();

		httpMock
			.expectOne((r) => r.url === `${baseUrl}/xp/me/history`)
			.flush(
				makeHistoryResponse([
					{
						id: "tx1",
						action: "game_added",
						baseXp: 50,
						multiplier: 1.5,
						finalXp: 75,
						metadata: {},
						createdAt: new Date().toISOString(),
					},
				]),
			);

		await waitFor(() => {
			expect(screen.getByText("Added a game")).toBeTruthy();
			expect(screen.getByText("+75 XP")).toBeTruthy();
		});

		flushXpProfileRequests(httpMock);
		httpMock.verify();
	});

	it("should show Load more button when there are more pages", async () => {
		const { httpMock } = await renderHistory();

		httpMock
			.expectOne((r) => r.url === `${baseUrl}/xp/me/history`)
			.flush(
				makeHistoryResponse(
					[
						{
							id: "tx1",
							action: "event_created",
							baseXp: 100,
							multiplier: 1,
							finalXp: 100,
							metadata: {},
							createdAt: new Date().toISOString(),
						},
					],
					{ page: 1, totalPages: 3 },
				),
			);

		await waitFor(() => {
			expect(screen.getByRole("button", { name: /Load more/i })).toBeTruthy();
		});

		flushXpProfileRequests(httpMock);
		httpMock.verify();
	});

	it("should not show Load more button when on last page", async () => {
		const { httpMock } = await renderHistory();

		httpMock
			.expectOne((r) => r.url === `${baseUrl}/xp/me/history`)
			.flush(
				makeHistoryResponse(
					[
						{
							id: "tx1",
							action: "game_added",
							baseXp: 50,
							multiplier: 1,
							finalXp: 50,
							metadata: {},
							createdAt: new Date().toISOString(),
						},
					],
					{ page: 1, totalPages: 1 },
				),
			);

		await waitFor(() => {
			expect(screen.getByText("Added a game")).toBeTruthy();
		});

		expect(screen.queryByRole("button", { name: /Load more/i })).toBeNull();

		flushXpProfileRequests(httpMock);
		httpMock.verify();
	});

	it("should load more transactions when Load more is clicked", async () => {
		const { httpMock, fixture } = await renderHistory();

		httpMock
			.expectOne((r) => r.url === `${baseUrl}/xp/me/history`)
			.flush(
				makeHistoryResponse(
					[
						{
							id: "tx1",
							action: "game_added",
							baseXp: 50,
							multiplier: 1,
							finalXp: 50,
							metadata: {},
							createdAt: new Date().toISOString(),
						},
					],
					{ page: 1, totalPages: 2 },
				),
			);

		await waitFor(() => {
			expect(screen.getByRole("button", { name: /Load more/i })).toBeTruthy();
		});

		fireEvent.click(screen.getByRole("button", { name: /Load more/i }));

		httpMock
			.expectOne((r) => r.url === `${baseUrl}/xp/me/history`)
			.flush(
				makeHistoryResponse(
					[
						{
							id: "tx2",
							action: "participant_joined",
							baseXp: 25,
							multiplier: 1,
							finalXp: 25,
							metadata: {},
							createdAt: new Date().toISOString(),
						},
					],
					{ page: 2, totalPages: 2 },
				),
			);

		fixture.detectChanges();

		await waitFor(() => {
			const rows = screen.getAllByTestId("xp-transaction-row");
			expect(rows.length).toBe(2);
		});

		flushXpProfileRequests(httpMock);
		httpMock.verify();
	});

	it("should display correct action labels", async () => {
		const { httpMock } = await renderHistory();

		httpMock
			.expectOne((r) => r.url === `${baseUrl}/xp/me/history`)
			.flush(
				makeHistoryResponse([
					{
						id: "tx1",
						action: "game_added",
						baseXp: 50,
						multiplier: 1,
						finalXp: 50,
						metadata: {},
						createdAt: new Date().toISOString(),
					},
					{
						id: "tx2",
						action: "event_created",
						baseXp: 100,
						multiplier: 1,
						finalXp: 100,
						metadata: {},
						createdAt: new Date().toISOString(),
					},
					{
						id: "tx3",
						action: "participant_joined",
						baseXp: 25,
						multiplier: 1,
						finalXp: 25,
						metadata: {},
						createdAt: new Date().toISOString(),
					},
				]),
			);

		await waitFor(() => {
			expect(screen.getByText("Added a game")).toBeTruthy();
			expect(screen.getByText("Created an event")).toBeTruthy();
			expect(screen.getByText("Joined an event")).toBeTruthy();
		});

		flushXpProfileRequests(httpMock);
		httpMock.verify();
	});
});
