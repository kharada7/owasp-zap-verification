import { expect, test } from "@playwright/test";
import { login } from "../pages/login";
import {
  closeBlockingOverlays,
  closeCookieBanner,
  dismissWelcomeBanner,
  openAccountMenuAndClickLogin,
  neutralizeCookieBanner,
} from "../testutil/juice-shop-playwright-util";

test("juice-shop scenario 01", async ({ page }) => {
  test.setTimeout(60000);

  page.on("console", (msg) => {
    console.log(msg.text());
  });

  await page.setViewportSize({ width: 1280, height: 720 });

  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });

  // Close cookie banner and neutralize its overlay if it keeps intercepting clicks.
  await closeCookieBanner(page);

  // Close welcome modal if shown.
  await dismissWelcomeBanner(page);

  await closeBlockingOverlays(page);

  // Open account menu and click login in overlay pane with retries.
  await openAccountMenuAndClickLogin(page);

  await expect(page).toHaveURL(/#\/login$/);

  await login(page, "jim@juice-sh.op", "ncc-1701");

  await expect(page).toHaveURL(/#\/(search|\/search)$/);
  await neutralizeCookieBanner(page);

  // Attempt to add the sold-out mask, then add Lemon Juice.
  await page
    .locator("mat-card")
    .filter({ hasText: 'Best Juice Shop Salesman Artwork' })
    .getByRole("button", { name: "Add to Basket" })
    .click();
  await page
    .locator("mat-card")
    .filter({ hasText: "Lemon Juice (500ml)" })
    .getByRole("button", { name: "Add to Basket" })
    .click();

  await page.getByRole("button", { name: "Show the shopping cart" }).click();
  await expect(page).toHaveURL(/#\/basket$/);

  await page.getByRole("button", { name: "Checkout" }).click();
  await expect(page).toHaveURL(/#\/address\/select$/);

  await page.getByRole("button", { name: "Add a new address" }).click();
  await expect(page).toHaveURL(/#\/address\/create$/);

  await page.getByRole("textbox", { name: "Country" }).fill("Japan");
  await page.getByRole("textbox", { name: "Name" }).fill("Alice");
  await page
    .getByRole("spinbutton", { name: "Mobile Number" })
    .fill("01234567890");
  await page.getByRole("textbox", { name: "ZIP Code" }).fill("135-0061");
  await page.getByRole("textbox", { name: "Address" }).fill("Toyosu 1-1-1");
  await page.getByRole("textbox", { name: "City" }).fill("Koto-ku");
  await page.getByRole("textbox", { name: "State" }).fill("Tokyo");
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page).toHaveURL(/#\/address\/select$/);

  const aliceAddressRow = page.locator("tr, mat-row").filter({ hasText: /Alice/ });
  await expect(aliceAddressRow.first()).toBeVisible();

  await aliceAddressRow.first().locator("mat-radio-button").first().click();
  await page.getByRole("button", { name: /Proceed|Continue/i }).click();

  await expect(page).toHaveURL(/#\/delivery-method$/);

  const fastDeliveryRow = page
    .locator("tr, mat-row")
    .filter({ hasText: /Fast Delivery/ });
  await expect(fastDeliveryRow.first()).toBeVisible();

  await fastDeliveryRow.first().locator("mat-radio-button").first().click();
  await page.getByRole("button", { name: /Proceed|Continue/i }).click();

  await expect(page).toHaveURL(/#\/payment\/shop$/);

  const paymentMethodRow = page.locator("tr, mat-row").filter({ hasText: /\/\d{4}$/ });
  await expect(paymentMethodRow.first()).toBeVisible();
  await paymentMethodRow.first().locator("mat-radio-button").first().click();
  await page.getByRole("button", { name: /Proceed|Continue/i }).click();

  await expect(page).toHaveURL(/#\/order-summary$/);

  await page.getByRole("button", { name: "Complete your purchase" }).click();

  await expect(page).toHaveURL(/#\/order-completion\//);
  await expect(
    page.getByRole("heading", { name: "Thank you for your purchase!" }),
  ).toBeVisible();
});
