import { expect, test } from "@playwright/test";
import { login } from "../pages/login";
import {
  closeBlockingOverlays,
  closeCookieBanner,
  dismissWelcomeBanner,
  openAccountMenuAndClickLogin,
  neutralizeCookieBanner,
} from "../testutil/juice-shop-playwright-util";

// ログイン後に About Us ページにアクセスするシナリオ
test("access-about-us-page", async ({ page }) => {
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

  await page.getByRole("button", { name: "Open Sidenav" }).click();
  await page.getByRole("link", { name: "Go to About Us page" }).click();
  await expect(page).toHaveURL(/#\/about$/);

  // About Us ページの内容を確認する。
  await expect(page.getByRole("heading", { name: "About Us" })).toBeVisible();

  // legal.md のリンクをクリックする。
    await page.getByRole("link", { name: "Link to the Terms of Use" }).click();
});
