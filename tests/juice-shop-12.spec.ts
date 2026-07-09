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

// ログイン後に商品をカートに入れて購入し、その後 Recycle で回収依頼を送信するシナリオ
test("add-cart-and-buy-and-recycle", async ({ page }) => {
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

  // 右上の Account アイコンから Recycle へ移動する。
  await page.getByRole("button", { name: "Show/hide account menu" }).click();
  await page
    .getByRole("menuitem", { name: "Show Orders and Payment Menu" })
    .click();
  await page.getByRole("menuitem", { name: "Go to recycling page" }).click();

  await expect(page).toHaveURL(/#\/recycle$/);

  // Quantity に 10 を入力する。
  await page.getByRole("spinbutton", { name: "Quantity" }).fill("10");

  // My Saved Addresses の一番上のラジオボタンをクリックする。
  await page.locator("mat-radio-button").first().click();

  // Submit をクリックする。
  await page.getByRole("button", { name: "Submit" }).click();
});
