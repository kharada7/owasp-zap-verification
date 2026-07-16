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

// ログイン後に Privacy & Security から Last Login IP ペ�Eジへ移動するシナリオ
test("navigate-to-last-login-ip", async ({ page }) => {
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

  // Account ↁEPrivacy & Security ↁELast Login IP の頁E��移動する、E
  await stabilizeUi(page);
  await openAccountMenuSafely(page);
  await clickMenuItemSafely(page, "Show Privacy and Security Menu");
  await clickMenuItemSafely(page, "Go to last login ip page");

  await expect(page).toHaveURL(/#\/privacy-security\/last-login-ip$/);
  await expect(page.getByRole("heading", { name: "Last Login IP", exact: true })).toBeVisible();
});
