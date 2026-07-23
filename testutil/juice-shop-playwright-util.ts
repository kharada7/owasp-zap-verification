import { Page } from "@playwright/test";

// オーバーレイが表示されている場合は閉じる。最大5回までリトライ。
export const closeBlockingOverlays = async (page: Page) => {
  const backdrop = page.locator(
    ".cdk-overlay-backdrop.cdk-overlay-backdrop-showing",
  );
  for (let i = 0; i < 5; i++) {
    await dismissWelcomeBanner(page);

    if (!(await backdrop.first().isVisible().catch(() => false))) {
      return;
    }
    await page.keyboard.press("Escape").catch(() => {});
    await backdrop.first().click({ force: true }).catch(() => {});
    await backdrop.first().waitFor({ state: "hidden", timeout: 2000 }).catch(() => {});
  }
};

// アカウントメニューを開いてログインをクリックする。オーバーレイが邪魔している場合は閉じる。最大3回までリトライ。
export const openAccountMenuAndClickLogin = async (page: Page) => {
  const accountMenuButton = page.locator("#navbarAccount").first();
  const loginInMenu = page.locator(".cdk-overlay-pane #navbarLoginButton").first();

  for (let attempt = 1; attempt <= 5; attempt++) {
    if (page.isClosed()) {
      throw new Error("Page was closed before opening the account menu.");
    }

    await closeBlockingOverlays(page);
    await neutralizeCookieBanner(page);

    await accountMenuButton.waitFor({ state: "visible", timeout: 5000 });

    try {
      await accountMenuButton.click({ timeout: 5000 });
    } catch (error) {
      if (page.isClosed()) {
        throw new Error("Page was closed while clicking the account menu.");
      }
      if (attempt === 5) throw error;
      await page.waitForTimeout(300);
      continue;
    }

    await loginInMenu.waitFor({ state: "visible", timeout: 5000 });

    try {
      await loginInMenu.click({ timeout: 5000 });
      return;
    } catch (error) {
      await closeBlockingOverlays(page);
      if (attempt === 5) throw error;
      await page.waitForTimeout(300);
    }
  }
};

// Cookieバナーを閉じる。オーバーレイが邪魔している場合は閉じる。
export const neutralizeCookieBanner = async (page: Page) => {
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

// Cookieの同意ダイアログを閉じて無効化する。
export const closeCookieBanner = async (page: Page) => {
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
  await neutralizeCookieBanner(page);
};

// ウェルカムモーダルが表示されている場合は閉じる。
export const dismissWelcomeBanner = async (page: Page) => {
  const welcomeDialog = page.getByRole("dialog").filter({
    has: page.getByRole("button", { name: "Close Welcome Banner" }),
  });
  const dismissWelcome = page.getByRole("button", {
    name: "Close Welcome Banner",
  });

  // バナーは初期描画後に遅れて表示されることがあるため、短時間だけ待機する。
  await welcomeDialog.first().waitFor({ state: "visible", timeout: 5000 }).catch(() => {});

  for (let attempt = 1; attempt <= 3; attempt++) {
    if (!(await welcomeDialog.first().isVisible().catch(() => false))) {
      return;
    }

    await dismissWelcome.first().click({ force: true }).catch(() => {});
    await page.keyboard.press("Escape").catch(() => {});
    await welcomeDialog.first().waitFor({ state: "hidden", timeout: 2000 }).catch(() => {});

    if (!(await welcomeDialog.first().isVisible().catch(() => false))) {
      return;
    }
  }
};

// ログイン後の購入フローを実行し、注文完了画面まで進める。
export const completeJuiceShopPurchase = async (page: Page) => {
  try {
    console.log("[Purchase] Starting purchase flow...");
    
    // Search for Lemon Juice
    console.log("[Purchase] Navigating to search...");
    await page.goto("http://127.0.0.1:3000/#/search?q=Lemon%20Juice", {
      waitUntil: "networkidle",
    });

    console.log("[Purchase] Waiting for product card...");
    await page
      .locator("mat-card")
      .filter({ hasText: "Lemon Juice (500ml)" })
      .first()
      .waitFor({ state: "visible", timeout: 20000 });

    console.log("[Purchase] Adding to basket...");
    await page
      .locator("mat-card")
      .filter({ hasText: "Lemon Juice (500ml)" })
      .getByRole("button", { name: "Add to Basket" })
      .click();

    // Open cart
    console.log("[Purchase] Opening cart...");
    const cartButton = page.getByRole("button", { name: "Show the shopping cart" });
    await cartButton.waitFor({ state: "visible", timeout: 10000 });
    await cartButton.click();

    await page.waitForTimeout(500);
    console.log("[Purchase] Starting checkout...");
    const checkoutButton = page.getByRole("button", { name: "Checkout" });
    await checkoutButton.waitFor({ state: "visible", timeout: 10000 });
    await checkoutButton.click();

    // Add address
    console.log("[Purchase] Adding address...");
    const addAddressButton = page.getByRole("button", { name: "Add a new address" });
    await addAddressButton.waitFor({ state: "visible", timeout: 10000 });
    await addAddressButton.click();

    await page.waitForTimeout(500);
    console.log("[Purchase] Filling form...");
    await page.getByRole("textbox", { name: "Country" }).fill("Japan");
    await page.getByRole("textbox", { name: "Name" }).fill("Alice");
    await page
      .getByRole("spinbutton", { name: "Mobile Number" })
      .fill("01234567890");
    await page.getByRole("textbox", { name: "ZIP Code" }).fill("135-0061");
    await page.getByRole("textbox", { name: "Address" }).fill("Toyosu 1-1-1");
    await page.getByRole("textbox", { name: "City" }).fill("Koto-ku");
    await page.getByRole("textbox", { name: "State" }).fill("Tokyo");

    console.log("[Purchase] Submitting address...");
    const submitButton = page.getByRole("button", { name: "Submit" });
    await submitButton.waitFor({ state: "visible", timeout: 10000 });
    await submitButton.click();

    // Select address
    await page.waitForTimeout(500);
    console.log("[Purchase] Selecting address...");
    const aliceAddressRow = page
      .locator("tr, mat-row")
      .filter({ hasText: /Alice/ });
    await aliceAddressRow.first().waitFor({ state: "visible", timeout: 10000 });
    await aliceAddressRow.first().locator("mat-radio-button").first().click();

    await page.waitForTimeout(500);
    console.log("[Purchase] Proceeding to delivery...");
    const proceedButton1 = page.getByRole("button", { name: /Proceed|Continue/i });
    await proceedButton1.first().waitFor({ state: "visible", timeout: 10000 });
    await proceedButton1.first().click();

    // Select delivery
    await page.waitForTimeout(500);
    console.log("[Purchase] Selecting delivery...");
    const fastDeliveryRow = page
      .locator("tr, mat-row")
      .filter({ hasText: /Fast Delivery/ });
    await fastDeliveryRow.first().waitFor({ state: "visible", timeout: 10000 });
    await fastDeliveryRow.first().locator("mat-radio-button").first().click();

    await page.waitForTimeout(500);
    console.log("[Purchase] Proceeding to payment...");
    const proceedButton2 = page.getByRole("button", { name: /Proceed|Continue/i });
    await proceedButton2.first().waitFor({ state: "visible", timeout: 10000 });
    await proceedButton2.first().click();

    // Select payment
    await page.waitForTimeout(500);
    console.log("[Purchase] Selecting payment...");
    const paymentMethodRow = page
      .locator("tr, mat-row")
      .filter({ hasText: /\/\d{4}$/ });
    await paymentMethodRow.first().waitFor({ state: "visible", timeout: 10000 });
    await paymentMethodRow.first().locator("mat-radio-button").first().click();

    await page.waitForTimeout(500);
    console.log("[Purchase] Completing purchase...");
    const proceedButton3 = page.getByRole("button", { name: /Proceed|Continue/i });
    await proceedButton3.first().waitFor({ state: "visible", timeout: 10000 });
    await proceedButton3.first().click();

    // Complete purchase
    await page.waitForTimeout(500);
    console.log("[Purchase] Final confirmation...");
    const completeButton = page.getByRole("button", { name: "Complete your purchase" });
    await completeButton.waitFor({ state: "visible", timeout: 10000 });
    await completeButton.click();

    console.log("[Purchase] Confirming order completion...");
    await page.waitForTimeout(500);
    await page.waitForURL(/order-completion/, { timeout: 10000 });
    console.log("[Purchase] SUCCESS!");
  } catch (error) {
    console.error("[Purchase] FAILED:", error instanceof Error ? error.message : String(error));
    throw error;
  }
};
