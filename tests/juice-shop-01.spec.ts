import { expect, test, chromium } from "@playwright/test";

test("juice-shop scenario 01", async ({ page }) => {
  test.setTimeout(60000);

  const closeBlockingOverlays = async () => {
    const backdrop = page.locator(
      ".cdk-overlay-backdrop.cdk-overlay-backdrop-showing",
    );
    for (let i = 0; i < 5; i++) {
      if (!(await backdrop.first().isVisible().catch(() => false))) {
        return;
      }
      await page.keyboard.press("Escape").catch(() => {});
      await backdrop.first().click({ force: true }).catch(() => {});
      await backdrop.first().waitFor({ state: "hidden", timeout: 2000 }).catch(() => {});
    }
  };

  const openAccountMenuAndClickLogin = async () => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      await closeBlockingOverlays();

      await page.locator("#navbarAccount").click({ timeout: 10000 });

      const loginInMenu = page.locator(".cdk-overlay-pane #navbarLoginButton").first();
      await loginInMenu.waitFor({ state: "visible", timeout: 10000 });

      try {
        await loginInMenu.click({ timeout: 10000 });
        return;
      } catch (error) {
        await closeBlockingOverlays();
        if (attempt === 3) throw error;
      }
    }
  };

  const neutralizeCookieBanner = async () => {
    await page.evaluate(() => {
      for (const selector of [".cc-window", ".cc-revoke"]) {
        for (const el of Array.from(document.querySelectorAll(selector))) {
          const node = el as HTMLElement;
          node.style.pointerEvents = "none";
          node.style.visibility = "hidden";
          node.style.display = "none";
        }
      }
    });
  };

  page.on("console", (msg) => {
    console.log(msg.text());
  });

  const browser = await chromium.launch({
    proxy: {
      server: "http://127.0.0.1:8080",
    },
  });

  await page.setViewportSize({ width: 1280, height: 720 });

  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });

  // Close cookie banner and neutralize its overlay if it keeps intercepting clicks.
  const cookieConsent = page.getByRole("dialog", { name: "cookieconsent" });
  if (await cookieConsent.isVisible().catch(() => false)) {
    await page
      .getByRole("button", { name: /dismiss cookie message/i })
      .click({ force: true })
      .catch(() => {});
  }
  await page
    .locator('div[role="dialog"][aria-label="cookieconsent"]')
    .first()
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {});
  await neutralizeCookieBanner();

  // Close welcome modal if shown.
  const dismissWelcome = page.getByRole("button", {
    name: "Close Welcome Banner",
  });
  if (await dismissWelcome.isVisible().catch(() => false)) {
    await dismissWelcome.click();
  }

  await closeBlockingOverlays();

  // Open account menu and click login in overlay pane with retries.
  await openAccountMenuAndClickLogin();

  await expect(page).toHaveURL(/#\/login$/);

  await page
    .getByRole("textbox", { name: "Text field for the login email" })
    .fill("jim@juice-sh.op");
  await page
    .getByRole("textbox", { name: "Text field for the login password" })
    .fill("ncc-1701");
  await page.locator('button[id="loginButton"]').click();

  await expect(page).toHaveURL(/#\/(search|\/search)$/);
  await neutralizeCookieBanner();

  // Attempt to add the sold-out mask, then add Lemon Juice.
  await page
    .locator("mat-card")
    .filter({ hasText: 'Best Juice Shop Salesman Artwork' })
    .getByRole("button", { name: "Add to Basket" })
    .click();
  await page
    .locator("mat-card")
    .filter({ hasText: "Lemon Juice (500ml)" })
    .getByRole("button", { name: "Add to Basket" })
    .click();

  await page.getByRole("button", { name: "Show the shopping cart" }).click();
  await expect(page).toHaveURL(/#\/basket$/);

  await page.getByRole("button", { name: "Checkout" }).click();
  await expect(page).toHaveURL(/#\/address\/select$/);

  await page.getByRole("button", { name: "Add a new address" }).click();
  await expect(page).toHaveURL(/#\/address\/create$/);

  await page.getByRole("textbox", { name: "Country" }).fill("Japan");
  await page.getByRole("textbox", { name: "Name" }).fill("Alice");
  await page
    .getByRole("spinbutton", { name: "Mobile Number" })
    .fill("01234567890");
  await page.getByRole("textbox", { name: "ZIP Code" }).fill("135-0061");
  await page.getByRole("textbox", { name: "Address" }).fill("Toyosu 1-1-1");
  await page.getByRole("textbox", { name: "City" }).fill("Koto-ku");
  await page.getByRole("textbox", { name: "State" }).fill("Tokyo");
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page).toHaveURL(/#\/address\/select$/);

  const aliceAddressRow = page.locator("tr, mat-row").filter({ hasText: /Alice/ });
  await expect(aliceAddressRow.first()).toBeVisible();

  await aliceAddressRow.first().locator("mat-radio-button").first().click();
  await page.getByRole("button", { name: /Proceed|Continue/i }).click();

  await expect(page).toHaveURL(/#\/delivery-method$/);

  const fastDeliveryRow = page
    .locator("tr, mat-row")
    .filter({ hasText: /Fast Delivery/ });
  await expect(fastDeliveryRow.first()).toBeVisible();

  await fastDeliveryRow.first().locator("mat-radio-button").first().click();
  await page.getByRole("button", { name: /Proceed|Continue/i }).click();

  await expect(page).toHaveURL(/#\/payment\/shop$/);

  const paymentMethodRow = page.locator("tr, mat-row").filter({ hasText: /\/\d{4}$/ });
  await expect(paymentMethodRow.first()).toBeVisible();
  await paymentMethodRow.first().locator("mat-radio-button").first().click();
  await page.getByRole("button", { name: /Proceed|Continue/i }).click();

  await expect(page).toHaveURL(/#\/order-summary$/);

  await page.getByRole("button", { name: "Complete your purchase" }).click();

  await expect(page).toHaveURL(/#\/order-completion\//);
  await expect(
    page.getByRole("heading", { name: "Thank you for your purchase!" }),
  ).toBeVisible();
});
