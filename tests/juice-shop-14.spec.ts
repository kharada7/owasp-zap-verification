import { expect, test } from "@playwright/test";
import { login } from "../pages/login";
import {
  closeBlockingOverlays,
  closeCookieBanner,
  completeJuiceShopPurchase,
  dismissWelcomeBanner,
  openAccountMenuAndClickLogin,
  neutralizeCookieBanner,
} from "../testutil/juice-shop-playwright-util";

// ログイン後に購入を完了し、My Payment Options から新しいカードを追加するシナリオ
test("add-payment-method", async ({ page }) => {
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

  await completeJuiceShopPurchase(page);

  await expect(page).toHaveURL(/#\/order-completion\//);
  await expect(
    page.getByRole("heading", { name: "Thank you for your purchase!" }),
  ).toBeVisible();

  // Account → Orders & Payment → My Payment Options の順で移動する。
  await page.getByRole("button", { name: "Show/hide account menu" }).click();
  await page
    .getByRole("menuitem", { name: "Show Orders and Payment Menu" })
    .click();
  await page
    .getByRole("menuitem", { name: "Go to saved payment methods page" })
    .click();

  await expect(page).toHaveURL(/#\/saved-payment-methods$/);

  // Add new card をクリックして展開する。
  await page.getByRole("button", { name: /Add new card/i }).click();

  // カード情報を入力して Submit を押す。
  await page.getByRole("textbox", { name: "Name" }).fill("Taro Juice");
  await page.getByRole("spinbutton", { name: "Card Number" }).fill("4242424242424242");
  await page.getByRole("combobox", { name: "Expiry Month" }).selectOption("12");
  await page.getByRole("combobox", { name: "Expiry Year" }).selectOption("2080");

  await page.getByRole("button", { name: "Submit" }).click();
});
