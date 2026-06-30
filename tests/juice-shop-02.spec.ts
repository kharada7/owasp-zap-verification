import { expect, test } from "@playwright/test";
import { login } from "../pages/login";
import {
  closeBlockingOverlays,
  closeCookieBanner,
  dismissWelcomeBanner,
  openAccountMenuAndClickLogin,
  neutralizeCookieBanner,
} from "../testutil/juice-shop-playwright-util";

test("juice-shop scenario 02", async ({ page }) => {
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
  await page.getByRole("link", { name: "Go to contact us page" }).click();
  await expect(page).toHaveURL(/#\/contact$/);

  await page.getByRole("textbox", { name: "Field for entering the comment or the feedback" }).fill("Lemon Juice is great!");
  
  // type="range" の input 要素を取得する。
  const rangeInput = page.locator('input[type="range"]');
  // スライダーを最大値に設定する。
  await rangeInput.evaluate((input) => {
    input.ariaValueText = "★5";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

  // aria-label が "CAPTCHA code which must be solved" の code 要素を取得する。
  const captchaCodeElement = page.locator('code[aria-label="CAPTCHA code which must be solved"]');
  // CAPTCHA 文字列を取得する。
  const captchaCode = (await captchaCodeElement.textContent())?.trim();
  if (!captchaCode) {
    throw new Error("CAPTCHA code was not rendered on the contact form.");
  }

  const captchaAnswer = String(Function(`return (${captchaCode})`)());

  // aria-label が "Field for the result of the CAPTCHA code" のテキストボックスに CAPTCHA の計算結果を入力する。
  await page.getByRole("textbox", { name: "Field for the result of the CAPTCHA code" }).fill(captchaAnswer);

  // aria-label が "Button to send the review" のボタンをクリックする。
  await page.getByRole("button", { name: "Button to send the review" }).click();
});
