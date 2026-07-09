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

// ログイン後に商品をカートに入れて購入し、購入履歴を確認するシナリオ
test("add-cart-and-buy-and-check-order-history", async ({ page }) => {
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

  // 購入履歴ページにアクセスして、購入した商品が表示されることを確認する。
  await page.getByRole("button", { name: "Show/hide account menu" }).click();
  await page
    .getByRole("menuitem", { name: "Show Orders and Payment Menu" })
    .click();
  await page
    .getByRole("menuitem", { name: "Go to order history page" })
    .click();

  await expect(page).toHaveURL(/#\/order-history$/);

  // 一番上の注文行のレビューアイコンをクリックして、レビュー用ダイアログを開く。
  await page
    .locator("tr, mat-row")
    .filter({ hasText: "Best Juice Shop Salesman Artwork" })
    .getByRole("button")
    .first()
    .click();

  await expect(page.getByRole("heading", { name: "Write a review" })).toBeVisible();

  // レビューのモーダル上で Reviews を展開し、 Good ボタンをクリックする。
  const reviewsRegion = page.getByRole("region", { name: "Reviews (2)" });
  await page.getByRole("button", { name: /Reviews \(2\)/ }).click();
  const helpfulReviewButtons = reviewsRegion.getByRole("button", {
    name: "Rate a helpful review",
  });
  const firstHelpfulReviewButton = helpfulReviewButtons.first();
  if (await firstHelpfulReviewButton.isDisabled().catch(() => false)) {
    await helpfulReviewButtons.nth(1).click();
  } else {
    await firstHelpfulReviewButton.click();
  }

  // モーダルを閉じる。
  await page.getByRole("button", { name: "Close Dialog" }).click();
});
