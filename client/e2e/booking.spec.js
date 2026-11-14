import { test, expect } from "@playwright/test";

test.describe("Booking flow", () => {
	test("can view a room and reach booking page", async ({ page }) => {
		await page.goto("/rooms");
		await page.locator("a[href^='/rooms/room_']").first().click();
		await expect(page).toHaveURL(/\/rooms\/room_/);

		const future = new Date();
		future.setDate(future.getDate() + 30);
		const checkIn = future.toISOString().split("T")[0];
		future.setDate(future.getDate() + 2);
		const checkOut = future.toISOString().split("T")[0];

		await page.getByLabel(/Check in/i).fill(checkIn);
		await page.getByLabel(/Check out/i).fill(checkOut);
		await page.getByRole("button", { name: /Check availability/i }).click();
		await expect(page).toHaveURL(/\/book\//);
		await expect(page.getByRole("heading", { name: /Confirm your stay/i })).toBeVisible();
	});
});
