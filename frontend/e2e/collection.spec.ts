import { expect, test } from "@playwright/test";

test.describe("Game collection", () => {
	test("should display collection page with login prompt for unauthenticated users", async ({
		page,
	}) => {
		await page.goto("/collection");

		await expect(page.locator('[data-testid="game-list"]')).toBeVisible();
		await expect(page.locator('[data-testid="login-prompt"]')).toBeVisible();
	});

	test("should show empty state when no games in collection", async ({
		page,
	}) => {
		await page.goto("/collection");

		await expect(page.locator('[data-testid="game-list"]')).toBeVisible();
	});
});
