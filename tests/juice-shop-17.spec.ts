import { expect, test } from "@playwright/test";
import { login } from "../pages/login";
import {
  closeBlockingOverlays,
  closeCookieBanner,
  dismissWelcomeBanner,
  openAccountMenuAndClickLogin,
  neutralizeCookieBanner,
} from "../testutil/juice-shop-playwright-util";

// 繝ｭ繧ｰ繧､繝ｳ蠕後↓ Privacy & Security 縺九ｉ繝・・繧ｿ繧ｨ繧ｯ繧ｹ繝昴・繝医ｒ隕∵ｱゅ☆繧九す繝翫Μ繧ｪ
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
  await neutralizeCookieBanner(page);

  // Account 竊・Privacy & Security 竊・Request Data Export 縺ｮ鬆・〒遘ｻ蜍輔☆繧九・
  await page.getByRole("button", { name: "Show/hide account menu" }).click();
  await page
    .getByRole("menuitem", { name: "Show Privacy and Security Menu" })
    .click();
  await page
    .getByRole("menuitem", { name: "Go to data export page" })
    .click();

  await expect(page).toHaveURL(/#\/privacy-security\/data-export$/);

  // JSON 繧帝∈謚槭☆繧九・
  await page.getByRole("radio", { name: "Export Option JSON" }).check();

  // Request 繧偵け繝ｪ繝・け縺吶ｋ縲・
  await page
    .getByRole("button", { name: "Button to send the request" })
    .click();
});
