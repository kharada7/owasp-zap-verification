import { expect, test } from "@playwright/test";
import { login } from "../pages/login";
import {
  closeBlockingOverlays,
  closeCookieBanner,
  dismissWelcomeBanner,
  openAccountMenuAndClickLogin,
  neutralizeCookieBanner,
} from "../testutil/juice-shop-playwright-util";

// ログイン後にサポ�EトチャチE��ペ�Eジにアクセスして、コメントを送信するシナリオ
test("access-support-chat-and-submit-comment", async ({ page }) => {
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

  // サイドナビの "Go to chatbot page" リンクは Docker image のバージョンによって
  // 存在しない場合があるため、直接 URL へ遷移する。
  await page.goto("http://127.0.0.1:3000/#/chatbot", {
    waitUntil: "domcontentloaded",
  });
  await expect(page).toHaveURL(/#\/chatbot$/);
  // チャットボット UI が読み込まれるまで待機。
  await page
    .locator('input[aria-label="Text field for a chat message"]')
    .waitFor({ state: "visible", timeout: 10000 });

  // aria-label ぁE"Text field for a chat message" の input 要素を取得する、E
  const chatMessageInput = page.locator(
    'input[aria-label="Text field for a chat message"]',
  );
  // 取得しぁEinput 要素に "My name is Jim." とぁE��斁E���Eを�E力する、E
  await chatMessageInput.fill("My name is Jim.");
  // 取得しぁEinput 要素に対して Enter キーを押す、E
  await chatMessageInput.press("Enter");
});
