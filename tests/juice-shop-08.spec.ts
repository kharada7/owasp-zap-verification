import { expect, test } from "@playwright/test";
import { login } from "../pages/login";
import {
  closeBlockingOverlays,
  closeCookieBanner,
  dismissWelcomeBanner,
  openAccountMenuAndClickLogin,
  neutralizeCookieBanner,
} from "../testutil/juice-shop-playwright-util";

// ログイン後に Photo Wall ペ�Eジにアクセスして画像をアチE�Eロードするシナリオ
test("access-photo-wall-page", async ({ page }) => {
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
  await page.getByRole("link", { name: "Go to photo wall" }).click();
  await expect(page).toHaveURL(/#\/photo-wall$/);

  // Photo Wall ペ�Eジの冁E��を確認する、E
  await expect(page.getByRole("heading", { name: "Photo Wall" })).toBeVisible();

  // 画像をアチE�Eロードする、E
  await page.getByRole("button", { name: "Pick image" }).click();
  await page.setInputFiles(
    'input[type="file"]',
    "tests/files/profile-picture.png",
  );

  await page.getByRole("textbox", { name: "Caption" }).fill("Nice photo!");
  // mat-icon は aria-hidden="true" でレンダリングされるため、ボタンの
  // accessible name は "Submit" のみ。ID セレクターで確実に指定する。
  await page.locator("#submitButton").click();

  await expect(
    page.getByText("Your image was successfully uploaded."),
  ).toBeVisible();
});
