import { expect, test } from "@playwright/test";
import { login } from "../pages/login";
import {
  closeBlockingOverlays,
  closeCookieBanner,
  dismissWelcomeBanner,
  openAccountMenuAndClickLogin,
  neutralizeCookieBanner,
} from "../testutil/juice-shop-playwright-util";

// 繝ｭ繧ｰ繧､繝ｳ蠕後↓ About Us 繝壹・繧ｸ縺ｫ繧｢繧ｯ繧ｻ繧ｹ縺吶ｋ繧ｷ繝翫Μ繧ｪ
test("access-about-us-page", async ({ page }) => {
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

  await page.getByRole("button", { name: "Open Sidenav" }).click();
  await page.getByRole("link", { name: "Go to About Us page" }).click();
  await expect(page).toHaveURL(/#\/about$/);

  // About Us 繝壹・繧ｸ縺ｮ蜀・ｮｹ繧堤｢ｺ隱阪☆繧九・
  await expect(page.getByRole("heading", { name: "About Us" })).toBeVisible();

  // legal.md 縺ｮ繝ｪ繝ｳ繧ｯ繧偵け繝ｪ繝・け縺吶ｋ縲・
    await page.getByRole("link", { name: "Link to the Terms of Use" }).click();
});
