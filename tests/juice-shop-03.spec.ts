import { expect, test } from "@playwright/test";
import { login } from "../pages/login";
import {
  closeBlockingOverlays,
  closeCookieBanner,
  dismissWelcomeBanner,
  openAccountMenuAndClickLogin,
  neutralizeCookieBanner,
} from "../testutil/juice-shop-playwright-util";

// 繝ｭ繧ｰ繧､繝ｳ蠕後↓ Complain 繝壹・繧ｸ縺ｫ繧｢繧ｯ繧ｻ繧ｹ縺励※縲∬協諠・ｒ騾∽ｿ｡縺吶ｋ繧ｷ繝翫Μ繧ｪ
test("access-complain-and-submit-complaint", async ({ page }) => {
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
  await page.getByRole("link", { name: "Go to complain page" }).click();
  await expect(page).toHaveURL(/#\/complain$/);

  const complaintText = "Too Late! I want my money back!";
  const complaintTextarea = page.locator("textarea#complaintMessage[aria-label='Field for entering the complaint']");
  await expect(complaintTextarea).toHaveCount(1);
  await expect(complaintTextarea).toBeVisible();
  await expect(complaintTextarea).toBeEditable();
  await complaintTextarea.fill(complaintText);
  await complaintTextarea.blur();
  await expect(complaintTextarea).toHaveValue(complaintText);
  // input["type=file"] 隕∫ｴ繧貞叙蠕励☆繧九・
  const fileInput = page.locator('input[type="file"]');
  // 繝輔ぃ繧､繝ｫ繧偵い繝・・繝ｭ繝ｼ繝峨☆繧九・
  await fileInput.setInputFiles("tests/files/tiny.pdf");

  // aria-label 縺・"Button to send the complaint" 縺ｮ button 繧偵け繝ｪ繝・け縺吶ｋ縲・
  const sendComplaintButton = page.getByRole("button", { name: "Button to send the complaint" });
  await expect(sendComplaintButton).toBeEnabled();
  await sendComplaintButton.click();

});
