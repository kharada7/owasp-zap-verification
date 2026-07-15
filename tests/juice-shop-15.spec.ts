import { expect, test } from "@playwright/test";
import { login } from "../pages/login";
import {
  closeBlockingOverlays,
  closeCookieBanner,
  completeJuiceShopPurchase,
  dismissWelcomeBanner,
  openAccountMenuAndClickLogin,
  neutralizeCookieBanner,
} from "../testutil/juice-shop-playwright-util";

// 繝ｭ繧ｰ繧､繝ｳ蠕後↓雉ｼ蜈･繧貞ｮ御ｺ・＠縲．igital Wallet 縺九ｉ谿矩ｫ倥ｒ霑ｽ蜉縺吶ｋ繧ｷ繝翫Μ繧ｪ
test("add-digital-wallet-balance", async ({ page }) => {
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

  await completeJuiceShopPurchase(page);

  await expect(page).toHaveURL(/#\/order-completion\//);
  await expect(
    page.getByRole("heading", { name: "Thank you for your purchase!" }),
  ).toBeVisible();

  // Account 竊・Orders & Payment 竊・Digital Wallet 縺ｮ鬆・〒遘ｻ蜍輔☆繧九・
  await page.getByRole("button", { name: "Show/hide account menu" }).click();
  await page
    .getByRole("menuitem", { name: "Show Orders and Payment Menu" })
    .click();
  await page
    .getByRole("menuitem", { name: "Go to wallet page" })
    .click();

  await expect(page).toHaveURL(/#\/wallet$/);

  // Amount 縺ｫ 100 繧貞・蜉帙＠縺ｦ Deposit 繧偵け繝ｪ繝・け縺吶ｋ縲・
  await page.getByRole("spinbutton", { name: "Enter an amount" }).fill("100");
  await page.getByRole("button", { name: "Button to continue to payment" }).click();

  await expect(page).toHaveURL(/#\/payment\/wallet$/);
});
