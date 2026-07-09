import { expect, test } from "@playwright/test";
import { login } from "../pages/login";
import {
  closeBlockingOverlays,
  closeCookieBanner,
  dismissWelcomeBanner,
  openAccountMenuAndClickLogin,
  neutralizeCookieBanner,
} from "../testutil/juice-shop-playwright-util";

// ログイン後に Photo Wall ページにアクセスして画像をアップロードするシナリオ
test("access-photo-wall-page", async ({ page }) => {
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
  await page.getByRole("link", { name: "Go to photo wall" }).click();
  await expect(page).toHaveURL(/#\/photo-wall$/);

  // Photo Wall ページの内容を確認する。
  await expect(page.getByRole("heading", { name: "Photo Wall" })).toBeVisible();

  // 画像をアップロードする。
  await page.getByRole("button", { name: "Pick image" }).click();
  await page.setInputFiles(
    'input[type="file"]',
    "tests/files/profile-picture.png",
  );

  await page.getByRole("textbox", { name: "Caption" }).fill("Nice photo!");
  await page.getByRole("button", { name: /send submit/i }).click();

  await expect(
    page.getByText("Your image was successfully uploaded."),
  ).toBeVisible();
});
