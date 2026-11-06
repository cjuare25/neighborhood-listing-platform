import { expect, test } from "@playwright/test";

test("user can browse the featured property and save it as a favorite", async ({
  page,
}) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Neighborhood Property Listings",
    }),
  ).toBeVisible();

  await page
    .getByRole("link", { name: "Browse this neighborhood" })
    .click();

  await expect(page).toHaveURL(/#featured-properties-heading$/);

  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Featured properties",
    }),
  ).toBeVisible();

  const addFavoriteButton = page.getByRole("button", {
    name: "Add 125 Maple Street to favorites",
  });

  await addFavoriteButton.click();

  await expect(
    page.getByRole("button", {
      name: "Remove 125 Maple Street from favorites",
    }),
  ).toBeVisible();

  await expect(page.getByText("Sponsored Partner")).toBeVisible();

  await expect(
    page.getByRole("link", {
      name: /Visit sponsor: Down to Earth Coffee\. Sponsored Partner/,
    }),
  ).toHaveAttribute("rel", /sponsored/);
});