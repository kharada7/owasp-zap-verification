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

  await page.goto("http://host.docker.internal:3000", { waitUntil: "load" });

  // ページ内容を確認
  const pageContent = await page.content();
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("=== Page content check ===");
  console.log("Page title:", await page.title());
  console.log("Body text preview:", bodyText.substring(0, 500));

  // コンソールエラーをキャッチ
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.error("Browser console error:", msg.text());
    }
  });

  // ネットワークエラーをログ
  page.on("response", (response) => {
    if (!response.ok()) {
      console.warn(`Network error: ${response.status()} ${response.url()}`);
    }
  });

  // 診断用スクリーンショット
  await page.screenshot({ path: "test-results/after-goto.png" });
  await page.waitForSelector("app-root", { state: "attached" });
  await page.waitForSelector("#navbarAccount", { state: "visible" });

  await page.locator("#navbarAccount").click();
  await page.locator("#navbarLoginButton").click();

  await page.locator("#email").fill("demo@juice-sh.op");
  await page.locator("#password").fill("demo");

  await page.locator("#loginButton").click();

  await page.goto("http://host.docker.internal:3000/#/search", {
    waitUntil: "domcontentloaded",
  });

  await browser.close();
});
