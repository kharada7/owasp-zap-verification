import { expect, test, chromium } from "@playwright/test";

test("juice-shop scenario 01", async ({ page }) => {
  test.setTimeout(180000);

  page.on("console", (msg) => {
    console.log(msg.text());
  });

  const browser = await chromium.launch({
    proxy: {
      server: "http://127.0.0.1:8080",
    },
  });

  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });

  // Close cookie banner if shown.
  const cookieConsent = page.getByRole("dialog", { name: "cookieconsent" });
  if (await cookieConsent.isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "dismiss cookie message" }).click();
  }

  // Close welcome modal if shown.
  const dismissWelcome = page.getByRole("button", {
    name: "Close Welcome Banner",
  });
  if (await dismissWelcome.isVisible().catch(() => false)) {
    await dismissWelcome.click();
  }

  // Open login from left sidenav if possible, otherwise via account menu.
  const openSidenav = page.getByRole("button", { name: "Open Sidenav" });
  if (await openSidenav.isVisible().catch(() => false)) {
    await openSidenav.click();
    const sidenavLogin = page.getByRole("link", { name: "Login" });
    if (await sidenavLogin.isVisible().catch(() => false)) {
      await sidenavLogin.click();
    } else {
      await page
        .getByRole("button", { name: "Show/hide account menu" })
        .click();
      await page.getByRole("menuitem", { name: "Login" }).click();
    }
  } else {
    await page.getByRole("button", { name: "Show/hide account menu" }).click();
    await page.getByRole("menuitem", { name: "Login" }).click();
  }

  await expect(page).toHaveURL(/#\/login$/);

  await page
    .getByRole("textbox", { name: "Text field for the login email" })
    .fill("jim@juice-sh.op");
  await page
    .getByRole("textbox", { name: "Text field for the login password" })
    .fill("ncc-1701");
  await page.locator('button[name="Login"][id="loginButton"]').click();

  await expect(page).toHaveURL(/#\/(search|\/search)$/);

  // Attempt to add the sold-out mask, then add Lemon Juice.
  await page
    .locator("mat-card")
    .filter({ hasText: 'OWASP Juice Shop "King of the Hill" Facemask' })
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

  await page
    .locator("tr")
    .filter({ hasText: "Alice" })
    .getByRole("radio")
    .check();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/#\/delivery-method$/);

  await page
    .locator("tr")
    .filter({ hasText: "Fast Delivery" })
    .getByRole("radio")
    .check();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/#\/payment\/shop$/);

  await page.locator("table").first().getByRole("radio").first().check();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/#\/order-summary$/);

  await page.getByRole("button", { name: "Complete your purchase" }).click();

  await expect(page).toHaveURL(/#\/order-completion\//);
  await expect(
    page.getByRole("heading", { name: "Thank you for your purchase!" }),
  ).toBeVisible();
});
