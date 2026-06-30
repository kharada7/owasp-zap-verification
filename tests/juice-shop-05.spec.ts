import { expect, test } from "@playwright/test";
import { login } from "../pages/login";
import {
  closeBlockingOverlays,
  closeCookieBanner,
  dismissWelcomeBanner,
  openAccountMenuAndClickLogin,
  neutralizeCookieBanner,
} from "../testutil/juice-shop-playwright-util";

test("juice-shop scenario 05", async ({ page }) => {
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

  // aria-label が "Show/hide account menu" のボタンをクリックする
  await page.getByRole("button", { name: "Show/hide account menu" }).click();

  // アカウントメニューの "Go to user profile" メニュー項目をクリックする
  await expect(page.getByRole("menu")).toBeVisible();
  await page.getByRole("menuitem", { name: "Go to user profile" }).click();

  // URL が /profile に遷移することを確認する
  await expect(page).toHaveURL(/\/profile$/);

  // aria-label が "Input for selecting the profile picture" の input[type=file] 要素を取得する
  const profilePictureInput = page.locator(
    'input[aria-label="Input for selecting the profile picture"][type="file"]',
  );
  // ファイルをアップロードする
  await profilePictureInput.setInputFiles("tests/files/profile-picture.png");
  // aria-label が "Button to upload the profile picture" のボタンをクリックする
  await page
    .getByRole("button", { name: "Button to upload the profile picture" })
    .click();

  // aria-label が "Text field for the image link" のテキストボックスに "https://example.com/profile-picture.png" を入力する
  await page
    .getByRole("textbox", { name: "Text field for the image link" })
    .fill("https://example.com/profile-picture.png");
  // aria-label が "Button to include image from link" のボタンをクリックする
  await page
    .getByRole("button", { name: "Button to include image from link" })
    .click();

  // aria-label が "Text field for the username" のテキストボックスに "new-username" を入力する
  await page
    .getByRole("textbox", { name: "Text field for the username" })
    .fill("new-username");
  // aria-label が "Button to save/set the username" のボタンをクリックする
  await page
    .getByRole("button", { name: "Button to save/set the username" })
    .click();
});
