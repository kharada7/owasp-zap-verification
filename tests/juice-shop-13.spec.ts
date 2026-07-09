import { expect, test } from "@playwright/test";
import { login } from "../pages/login";
import {
  closeBlockingOverlays,
  closeCookieBanner,
  dismissWelcomeBanner,
  openAccountMenuAndClickLogin,
  neutralizeCookieBanner,
} from "../testutil/juice-shop-playwright-util";

// ログイン後に My saved addresses から新しい住所を追加するシナリオ
test("add-new-saved-address", async ({ page }) => {
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

  // Account → Orders & Payment → My saved addresses の順で移動する。
  await page.getByRole("button", { name: "Show/hide account menu" }).click();
  await page
    .getByRole("menuitem", { name: "Show Orders and Payment Menu" })
    .click();
  await page
    .getByRole("menuitem", { name: "Go to saved address page" })
    .click();

  await expect(page).toHaveURL(/#\/address\/saved$/);

  // 画面下部の Add New Address をクリックする。
  await page.getByRole("button", { name: "Add a new address" }).click();

  await expect(page).toHaveURL(/#\/address\/create$/);

  // 住所入力欄に適当な文字列を入力して Submit を押す。
  await page.getByRole("textbox", { name: "Country" }).fill("Japan");
  await page.getByRole("textbox", { name: "Name" }).fill("Taro Juice");
  await page.getByRole("spinbutton", { name: "Mobile Number" }).fill("1234567890");
  await page.getByRole("textbox", { name: "ZIP Code" }).fill("12345678");
  await page
    .getByRole("textbox", { name: "Address" })
    .fill("1-2-3 Orchard Street");
  await page.getByRole("textbox", { name: "City" }).fill("Tokyo");
  await page.getByRole("textbox", { name: "State" }).fill("Tokyo");

  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page).toHaveURL(/#\/address\/saved$/);
});
