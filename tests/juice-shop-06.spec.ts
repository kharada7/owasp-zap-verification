import { expect, test } from "@playwright/test";
import { login } from "../pages/login";
import {
  closeBlockingOverlays,
  closeCookieBanner,
  dismissWelcomeBanner,
  openAccountMenuAndClickLogin,
  neutralizeCookieBanner,
} from "../testutil/juice-shop-playwright-util";

// ログイン後にサポートチャットページにアクセスして、コメントを送信するシナリオ
test("access-support-chat-and-submit-comment", async ({ page }) => {
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
  await page.getByRole("link", { name: "Go to chatbot page" }).click();
  await expect(page).toHaveURL(/#\/chatbot$/);

  // aria-label が "Text field for a chat message" の input 要素を取得する。
  const chatMessageInput = page.locator(
    'input[aria-label="Text field for a chat message"]',
  );
  // 取得した input 要素に "My name is Jim." という文字列を入力する。
  await chatMessageInput.fill("My name is Jim.");
  // 取得した input 要素に対して Enter キーを押す。
  await chatMessageInput.press("Enter");
});
