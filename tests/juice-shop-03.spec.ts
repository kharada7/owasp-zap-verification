import { expect, test } from "@playwright/test";
import { login } from "../pages/login";
import {
  closeBlockingOverlays,
  closeCookieBanner,
  dismissWelcomeBanner,
  openAccountMenuAndClickLogin,
  neutralizeCookieBanner,
} from "../testutil/juice-shop-playwright-util";

test("juice-shop scenario 03", async ({ page }) => {
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
  await page.getByRole("link", { name: "Go to complain page" }).click();
  await expect(page).toHaveURL(/#\/complain$/);

  await page.locator("textarea[aria-label='Field for entering the complaint']").fill("Too Late! I want my money back!");
  // input["type=file"] 要素を取得する。
  const fileInput = page.locator('input[type="file"]');
  // ファイルをアップロードする。
  await fileInput.setInputFiles("tests/files/page.pdf");

  // aria-label が "Button to send the complaint" の button をクリックする。
  await page.getByRole("button", { name: "Button to send the complaint" }).click();

});
