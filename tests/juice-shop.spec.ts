import { test, chromium } from "@playwright/test";

test("juice shop crawl", async ({ page }) => {
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
  });

  page = await context.newPage();

  await page.goto("http://localhost:3000");

  await page.click("#navbarAccount");
  await page.click("#navbarLoginButton");

  await page.fill("#email", "demo@juice-sh.op");
  await page.fill("#password", "demo");

  await page.click("#loginButton");

  await page.goto("http://localhost:3000/#/search");

  await browser.close();
});
