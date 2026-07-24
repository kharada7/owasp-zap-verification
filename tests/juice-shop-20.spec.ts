import { expect, test } from "@playwright/test";
import {
  closeBlockingOverlays,
  closeCookieBanner,
  dismissWelcomeBanner,
  neutralizeCookieBanner,
} from "../testutil/juice-shop-playwright-util";

// DOM XSS challenge related routes/endpoints to improve ZAP coverage.
test("seed-search-traffic-for-dom-xss", async ({ page }) => {
  test.setTimeout(90000);

  page.on("console", (msg) => {
    console.log(msg.text());
  });

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("http://127.0.0.1:3000/", { waitUntil: "domcontentloaded" });

  await closeCookieBanner(page);
  await dismissWelcomeBanner(page);
  await closeBlockingOverlays(page);

  const queries = [
    "apple",
    "<iframe src=\"javascript:alert(`xss`)\"></iframe>",
    "<img src=x onerror=alert(1)>",
    "<svg onload=alert(1)>",
    "\"'><script>alert(1)</script>",
  ];

  for (const query of queries) {
    const encoded = encodeURIComponent(query);

    // 1) Drive the SPA route used by localXssChallenge.
    await page.goto(`http://127.0.0.1:3000/#/search?q=${encoded}`, {
      waitUntil: "domcontentloaded",
    });
    await neutralizeCookieBanner(page);
    await closeBlockingOverlays(page);

    await expect(page).toHaveURL(/#\/search\?q=/);
    await expect(page).toHaveTitle(/OWASP Juice Shop/i);

    const searchResult = page.locator("app-search-result").first();
    await searchResult.waitFor({ state: "visible", timeout: 10000 });

    // 2) Hit the backend endpoint explicitly to ensure proxy traffic is generated.
    const response = await page.request.get(
      `http://127.0.0.1:3000/rest/products/search?q=${encoded}`,
    );
    expect(response.ok()).toBeTruthy();
  }
});
