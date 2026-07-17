import { expect, test } from "@playwright/test";
import { login } from "../pages/login";
import {
  closeBlockingOverlays,
  closeCookieBanner,
  dismissWelcomeBanner,
  openAccountMenuAndClickLogin,
  neutralizeCookieBanner,
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

  await page.getByRole("button", { name: "Show/hide account menu" }).click();
  await page
    .getByRole("menuitem", { name: "Show Privacy and Security Menu" })
    .click();
  await page
    .getByRole("menuitem", { name: "Go to last login ip page" })
    .click();

  // Account ↁEPrivacy & Security ↁELast Login IP の頁E��移動する、E
  await expect(page).toHaveURL(/#\/privacy-security\/last-login-ip$/);
  await expect(
    page.getByRole("heading", { name: "Last Login IP", exact: true }),
  ).toBeVisible();
});
