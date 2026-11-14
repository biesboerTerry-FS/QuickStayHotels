import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
	test("loads and shows hero", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByRole("heading", { name: /Discover Your Perfect/i })).toBeVisible();
	});

	test("search navigates to rooms", async ({ page }) => {
		await page.goto("/");
		await page.getByPlaceholder("City, e.g. London").fill("London");
		await page.getByRole("button", { name: "Search hotels" }).click();
		await expect(page).toHaveURL(/\/rooms/);
		await expect(page.getByText(/rooms? found/i)).toBeVisible();
	});

	test("offers link works", async ({ page }) => {
		await page.goto("/");
		await page.getByRole("link", { name: "Offers" }).click();
		await expect(page).toHaveURL("/offers");
		await expect(page.getByRole("heading", { name: "Special Offers" })).toBeVisible();
	});
});
