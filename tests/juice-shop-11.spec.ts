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

// ログイン後に商品をカートに入れて購入し、購入履歴から一番上の Track Order をクリックするシナリオ
test("add-cart-and-buy-and-track-order", async ({ page }) => {
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

  // 購入履歴ページにアクセスして、一番上の Track Order アイコンをクリックする。
  await page.getByRole("button", { name: "Show/hide account menu" }).click();
  await page
    .getByRole("menuitem", { name: "Show Orders and Payment Menu" })
    .click();
  await page
    .getByRole("menuitem", { name: "Go to order history page" })
    .click();

  await expect(page).toHaveURL(/#\/order-history$/);

  await page.getByRole("button", { name: "Track Your Order" }).first().click();
});
