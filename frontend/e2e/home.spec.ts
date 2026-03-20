import { expect, test } from '@playwright/test';

test.describe('Home page', () => {
	test('should display hero section with app branding', async ({ page }) => {
		await page.goto('/');

		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		await expect(page.locator('nav')).toBeVisible();
	});

	test('should navigate to collection page', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: /collection/i }).click();

		await expect(page).toHaveURL(/\/collection/);
	});

	test('should navigate to game nights page', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: /game nights/i }).click();

		await expect(page).toHaveURL(/\/game-nights/);
	});

	test('should navigate to calendar page', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: /calendar/i }).click();

		await expect(page).toHaveURL(/\/calendar/);
	});
});
