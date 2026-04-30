import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";

const place = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("./fixtures/place-detail.json", import.meta.url)),
    "utf8",
  ),
);

const viewports = [
  { name: "mobile", width: 360, height: 780 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 900 },
];

async function mockApi(page: Page) {
  await page.route("**/auth/me/", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ id: 1, username: "tester", email: "tester@example.com" }),
    });
  });

  await page.route("**/places/?**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        count: 1,
        next: null,
        previous: null,
        results: [place],
      }),
    });
  });

  await page.route("**/places/1/", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(place),
    });
  });
}

async function signIn(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("boraali_access", "test-access-token");
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(() => {
    const documentWidth = document.documentElement.scrollWidth;
    const viewportWidth = document.documentElement.clientWidth;
    const bodyWidth = document.body.scrollWidth;

    return documentWidth > viewportWidth || bodyWidth > viewportWidth;
  });

  expect(hasOverflow).toBe(false);
}

for (const viewport of viewports) {
  test(`places list has no horizontal overflow on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await mockApi(page);
    await signIn(page);

    await page.goto("/places");

    await expect(page.getByRole("heading", { name: "Bora Ali" })).toBeVisible();
    await expect(page.getByRole("button", { name: "+ New place" })).toBeVisible();
    await expect(page.getByText(place.name)).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test(`place detail has no horizontal overflow on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await mockApi(page);
    await signIn(page);

    await page.goto("/places/1");

    await expect(page.getByRole("heading", { name: place.name })).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
    await expect(page.getByText("Consumables summary")).toBeVisible();
    await expect(page.getByText("Extremely long item name")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
}
