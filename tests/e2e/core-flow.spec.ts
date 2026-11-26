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
test("filters preserve favorites and describe results and empty states", async ({
  page,
}) => {
  await page.goto("/");

  const city = page.getByRole("combobox", { name: "City", exact: true });
  const bedrooms = page.getByRole("combobox", { name: "Minimum bedrooms" });
  const search = page.getByRole("button", { name: "Search properties" });
  const listings = page.getByRole("list", { name: "Property listings" });
  const status = page.getByRole("status");

  await expect(listings.getByRole("article")).toHaveCount(3);

  await page
    .getByRole("button", { name: "Add 125 Maple Street to favorites" })
    .click();

  await city.selectOption("Pasadena, CA");

  // Changing a selection alone must not submit the form.
  await expect(listings.getByRole("article")).toHaveCount(3);

  await search.click();
  await expect(listings.getByRole("article")).toHaveCount(1);
  await expect(listings).toContainText("240 Oak Avenue");
  await expect(status).toContainText("Pasadena, CA");

  // A different search with the same count must update the status text.
  await city.selectOption("Long Beach, CA");
  await search.click();
  await expect(listings.getByRole("article")).toHaveCount(1);
  await expect(listings).toContainText("380 Cedar Lane");
  await expect(status).toContainText("Long Beach, CA");

  await city.selectOption("Pasadena, CA");
  await bedrooms.selectOption("4");
  await search.click();
  await expect(status).toContainText("0 properties found");
  await expect(status).toContainText("Try another city");
  await expect(listings).toHaveCount(0);

  await city.selectOption("");
  await bedrooms.selectOption("0");
  await search.click();
  await expect(listings.getByRole("article")).toHaveCount(3);

  const mapleFavorite = page.getByRole("button", {
    name: "Remove 125 Maple Street from favorites",
  });
  await expect(mapleFavorite).toHaveAttribute("aria-pressed", "true");

  await page
    .getByRole("button", { name: "Add 240 Oak Avenue to favorites" })
    .click();
  await expect(mapleFavorite).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", {
      name: "Remove 240 Oak Avenue from favorites",
    }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("invalid bedroom input shows an associated error and focuses the field", async ({
  page,
}) => {
  await page.goto("/");

  const bedrooms = page.getByRole("combobox", { name: "Minimum bedrooms" });

  await bedrooms.locator('option[value="0"]').evaluate((option) => {
    if (option instanceof HTMLOptionElement) {
      option.value = " ";
    }
  });

  await page.getByRole("button", { name: "Search properties" }).click();

  const alert = page
    .getByRole("form", { name: "Search properties" })
    .getByRole("alert");
  await expect(alert).toHaveText(
    "Choose a minimum bedroom count from the available options.",
  );
  await expect(bedrooms).toBeFocused();
  await expect(bedrooms).toHaveAttribute("aria-invalid", "true");

  const errorId = await alert.getAttribute("id");
  expect(errorId).toBeTruthy();
  await expect(bedrooms).toHaveAttribute("aria-describedby", errorId!);

  await bedrooms.selectOption("2");
  await expect(alert).toHaveCount(0);
  await expect(bedrooms).not.toHaveAttribute("aria-invalid", "true");

  await page.getByRole("button", { name: "Search properties" }).click();
  await expect(page.getByRole("status")).toContainText("3 properties found");
});
