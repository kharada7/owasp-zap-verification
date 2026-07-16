import { expect, test } from "@playwright/test";
import { login } from "../pages/login";
import {
  clickMenuItemSafely,
  closeBlockingOverlays,
  closeCookieBanner,
  dismissWelcomeBanner,
  openAccountMenuSafely,
  openAccountMenuAndClickLogin,
  neutralizeCookieBanner,
  stabilizeUi,
} from "../testutil/juice-shop-playwright-util";

// ログイン後に購入を完亁E��、Privacy Policy ペ�Eジへ移動するシナリオ
test("add-privacy-policy-navigation", async ({ page }) => {
  test.setTimeout(60000);

  page.on("console", (msg) => {
    console.log(msg.text());
  });

  await page.setViewportSize({ width: 1280, height: 720 });

  await page.goto("http://127.0.0.1:3000/", { waitUntil: "domcontentloaded" });

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

  await page
    .locator("mat-card")
    .filter({ hasText: "Lemon Juice (500ml)" })
    .getByRole("button", { name: "Add to Basket" })
    .click();

  await expect(page.getByRole("button", { name: "Show the shopping cart" })).toContainText("1");

  await page.getByRole("button", { name: "Show the shopping cart" }).click();

  const checkoutButton = page.getByRole("button", { name: "Checkout" });
  await expect(checkoutButton).toBeEnabled();
  await checkoutButton.click();

  await page.getByRole("button", { name: "Add a new address" }).click();

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

  const aliceAddressRow = page
    .locator("tr, mat-row")
    .filter({ hasText: /Alice/ });
  await aliceAddressRow.first().locator("mat-radio-button").first().click();
  await page.getByRole("button", { name: /Proceed|Continue/i }).click();

  const fastDeliveryRow = page
    .locator("tr, mat-row")
    .filter({ hasText: /Fast Delivery/ });
  await fastDeliveryRow.first().locator("mat-radio-button").first().click();
  await page.getByRole("button", { name: /Proceed|Continue/i }).click();

  const paymentMethodRow = page
    .locator("tr, mat-row")
    .filter({ hasText: /\/\d{4}$/ });
  await paymentMethodRow.first().locator("mat-radio-button").first().click();
  await page.getByRole("button", { name: /Proceed|Continue/i }).click();

  await page.getByRole("button", { name: "Complete your purchase" }).click();

  await expect(page).toHaveURL(/#\/order-completion\//);
  await expect(
    page.getByRole("heading", { name: "Thank you for your purchase!" }),
  ).toBeVisible();

  // Account ↁEPrivacy & Security ↁEPrivacy Policy の頁E��移動する、E
  await stabilizeUi(page);
  await openAccountMenuSafely(page);
  await clickMenuItemSafely(page, "Show Privacy and Security Menu");
  await clickMenuItemSafely(page, "Go to privacy policy page");

  await expect(page).toHaveURL(/#\/privacy-security\/privacy-policy$/);
  await expect(page.getByRole("heading", { name: "Privacy Policy", exact: true })).toBeVisible();
});
