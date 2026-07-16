import { expect, test } from "@playwright/test";
import { login } from "../pages/login";
import {
  clickMenuItemSafely,
  closeBlockingOverlays,
  closeCookieBanner,
  completeJuiceShopPurchase,
  dismissWelcomeBanner,
  openAccountMenuSafely,
  openAccountMenuAndClickLogin,
  neutralizeCookieBanner,
  stabilizeUi,
} from "../testutil/juice-shop-playwright-util";

// ログイン後に購入を完亁E��、Digital Wallet から残高を追加するシナリオ
test("add-digital-wallet-balance", async ({ page }) => {
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

  await completeJuiceShopPurchase(page);

  await expect(page).toHaveURL(/#\/order-completion\//);
  await expect(
    page.getByRole("heading", { name: "Thank you for your purchase!" }),
  ).toBeVisible();

  // Account ↁEOrders & Payment ↁEDigital Wallet の頁E��移動する、E
  await stabilizeUi(page);
  await openAccountMenuSafely(page);
  await clickMenuItemSafely(page, "Show Orders and Payment Menu");
  await clickMenuItemSafely(page, "Go to wallet page");

  await expect(page).toHaveURL(/#\/wallet$/);

  // Amount に 100 を�E力して Deposit をクリチE��する、E
  await page.getByRole("spinbutton", { name: "Enter an amount" }).fill("100");
  await page.getByRole("button", { name: "Button to continue to payment" }).click();

  await expect(page).toHaveURL(/#\/payment\/wallet$/);
});
