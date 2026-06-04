import { test, chromium } from '@playwright/test';

test('juice shop crawl', async ({ page }) => {

  page.on('console', msg => {
    console.log(msg.text());
  });

  await page.goto('http://localhost:3000');

  console.log(await page.title());

  await page.screenshot({
    path: 'first-page.png',
    fullPage: true
  });
});
