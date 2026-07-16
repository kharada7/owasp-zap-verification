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

// ログイン後に啁E��をカートに入れて購入し、購入履歴からレビューを投稿するシナリオ
test("add-cart-and-buy-and-submit-review", async ({ page }) => {
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

  // 購入履歴ペ�Eジにアクセスして、レビュー用ダイアログを開く、E
  await stabilizeUi(page);
  await openAccountMenuSafely(page);
  await clickMenuItemSafely(page, "Show Orders and Payment Menu");
  await clickMenuItemSafely(page, "Go to order history page");

  await expect(page).toHaveURL(/#\/order-history$/);

  await page
    .locator("tr, mat-row")
    .filter({ hasText: "Best Juice Shop Salesman Artwork" })
    .getByRole("button")
    .first()
    .click();

  const reviewDialog = page.getByRole("dialog").last();
  await expect(
    reviewDialog.getByRole("heading", { name: "Write a review" }),
  ).toBeVisible();

  // ダイアログ冁E��下へスクロールし、Review にコメントを入力する、E
  await reviewDialog.evaluate((dialog) => {
    dialog.scrollTop = dialog.scrollHeight;
  });

  await reviewDialog
    .getByRole("textbox", { name: "Text field to review a product" })
    .fill("Nice artwork!");

  await reviewDialog.getByRole("button", { name: "Send the review" }).click();
  await reviewDialog.getByRole("button", { name: "Close Dialog" }).click();
});
