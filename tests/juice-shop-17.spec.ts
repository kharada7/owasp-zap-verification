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

// ログイン後に Privacy & Security からチE�Eタエクスポ�Eトを要求するシナリオ
test("request-data-export", async ({ page }) => {
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
  await stabilizeUi(page);

  // Account ↁEPrivacy & Security ↁERequest Data Export の頁E��移動する、E
  await openAccountMenuSafely(page);
  await clickMenuItemSafely(page, "Show Privacy and Security Menu");
  await clickMenuItemSafely(page, "Go to data export page");

  await expect(page).toHaveURL(/#\/privacy-security\/data-export$/);

  // JSON を選択する、E
  await page.getByRole("radio", { name: "Export Option JSON" }).check();

  // Request をクリチE��する、E
  await page
    .getByRole("button", { name: "Button to send the request" })
    .click();
});
