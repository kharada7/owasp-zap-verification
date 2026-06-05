import { test, chromium } from "@playwright/test";

test("juice shop crawl", async ({ page }) => {
  test.setTimeout(120000);
  page.on("console", (msg) => {
    console.log(msg.text());
  });

  const browser = await chromium.launch({
    proxy: {
      server: "http://127.0.0.1:8080",
    },
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 },
  });

  page = await context.newPage();

  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);

  await page.goto("http://localhost:3000", { waitUntil: "load" });
  // 診断用スクリーンショット（タイムアウト調査後は削除可）
  await page.screenshot({ path: "test-results/after-goto.png" });
  await page.waitForSelector("app-root", { state: "attached" });
  await page.waitForSelector("#navbarAccount", { state: "visible" });

  await page.locator("#navbarAccount").click();
  await page.locator("#navbarLoginButton").click();

  await page.locator("#email").fill("demo@juice-sh.op");
  await page.locator("#password").fill("demo");

  await page.locator("#loginButton").click();

  await page.goto("http://localhost:3000/#/search", { waitUntil: "domcontentloaded" });

  await browser.close();
});
