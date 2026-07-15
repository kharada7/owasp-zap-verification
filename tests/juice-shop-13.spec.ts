import { expect, test } from "@playwright/test";
import { login } from "../pages/login";
import {
  closeBlockingOverlays,
  closeCookieBanner,
  dismissWelcomeBanner,
  openAccountMenuAndClickLogin,
  neutralizeCookieBanner,
} from "../testutil/juice-shop-playwright-util";

// 繝ｭ繧ｰ繧､繝ｳ蠕後↓ My saved addresses 縺九ｉ譁ｰ縺励＞菴乗園繧定ｿｽ蜉縺吶ｋ繧ｷ繝翫Μ繧ｪ
test("add-new-saved-address", async ({ page }) => {
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

  // Account 竊・Orders & Payment 竊・My saved addresses 縺ｮ鬆・〒遘ｻ蜍輔☆繧九・
  await page.getByRole("button", { name: "Show/hide account menu" }).click();
  await page
    .getByRole("menuitem", { name: "Show Orders and Payment Menu" })
    .click();
  await page
    .getByRole("menuitem", { name: "Go to saved address page" })
    .click();

  await expect(page).toHaveURL(/#\/address\/saved$/);

  // 逕ｻ髱｢荳矩Κ縺ｮ Add New Address 繧偵け繝ｪ繝・け縺吶ｋ縲・
  await page.getByRole("button", { name: "Add a new address" }).click();

  await expect(page).toHaveURL(/#\/address\/create$/);

  // 菴乗園蜈･蜉帶ｬ・↓驕ｩ蠖薙↑譁・ｭ怜・繧貞・蜉帙＠縺ｦ Submit 繧呈款縺吶・
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
