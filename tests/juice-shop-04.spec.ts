import { expect, test } from "@playwright/test";
import { login } from "../pages/login";
import {
  closeBlockingOverlays,
  closeCookieBanner,
  dismissWelcomeBanner,
  openAccountMenuAndClickLogin,
  neutralizeCookieBanner,
} from "../testutil/juice-shop-playwright-util";

test("juice-shop scenario 04", async ({ page }) => {
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
  await page.getByRole("link", { name: "Go to deluxe membership page" }).click();
  await expect(page).toHaveURL(/#\/deluxe-membership$/);

  // aria-label が "Become deluxe member" の button をクリックする。
  await page.getByRole("button", { name: "Become deluxe member" }).click();
  await expect(page).toHaveURL(/#\/payment\/deluxe$/);

  // ID が "mat-radio-43-input" の input[type=radio] 要素を選択する。
  await page.locator("#mat-radio-43-input").check();

  // ID が "mat-expansion-panel-header-1" の要素をクリックする
  await page.locator("#mat-expansion-panel-header-1").click();

  // ID が "coupon" の input[type=text] 要素に適当なクーポンコードを入力する。
  await page.locator("#coupon").fill("ZAP12345AB");

  // ID が "applyCouponButton"の button 要素をクリックする。
  await page.locator("#applyCouponButton").click();

  // aria-label が "Proceed to review" のボタンをクリックする。
  await page.getByRole("button", { name: "Proceed to review" }).click();
});
