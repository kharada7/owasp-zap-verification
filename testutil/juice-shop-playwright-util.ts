import { expect, Page } from "@playwright/test";

// オーバーレイが表示されている場合は閉じる。最大5回までリトライ。
export const closeBlockingOverlays = async (page: Page) => {
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

// CIで再出現しやすいCookie/Welcome/Backdropをまとめて安定化する。
export const stabilizeUi = async (page: Page) => {
  await closeCookieBanner(page);
  await dismissWelcomeBanner(page);
  await closeBlockingOverlays(page);
  await neutralizeCookieBanner(page);
};

// アカウントメニューを安定して開く。オーバーレイ干渉時は再試行する。
export const openAccountMenuSafely = async (page: Page) => {
  for (let i = 0; i < 4; i++) {
    await stabilizeUi(page);
    const account = page.getByRole("button", { name: "Show/hide account menu" });
    await expect(account).toBeVisible();
    await account.click();

    const menu = page.locator(".cdk-overlay-pane [role='menuitem']").first();
    if (await menu.isVisible().catch(() => false)) {
      return;
    }
  }
  throw new Error("Account menu did not open.");
};

// メニューアイテムを安定してクリックする。表示されていなければメニューを再オープンする。
export const clickMenuItemSafely = async (
  page: Page,
  name: string | RegExp,
) => {
  for (let i = 0; i < 4; i++) {
    await dismissWelcomeBanner(page);
    await closeBlockingOverlays(page);

    const item = page.getByRole("menuitem", { name });
    if (await item.isVisible().catch(() => false)) {
      await item.click();
      return;
    }

    await openAccountMenuSafely(page);
  }

  throw new Error(`Menu item not clickable: ${String(name)}`);
};

// アカウントメニューを開いてログインをクリックする。オーバーレイが邪魔している場合は閉じる。最大3回までリトライ。
export const openAccountMenuAndClickLogin = async (page: Page) => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    await stabilizeUi(page);

    await openAccountMenuSafely(page);
    await dismissWelcomeBanner(page);
    await closeBlockingOverlays(page);

    const loginInMenu = page.getByRole("menuitem", { name: /Login/i }).first();
    await loginInMenu.waitFor({ state: "visible", timeout: 10000 });

    try {
      await loginInMenu.click({ timeout: 10000 });
      return;
    } catch (error) {
      await closeBlockingOverlays(page);
      if (attempt === 3) throw error;
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
  const dismissWelcome = page.getByRole("button", {
    name: "Close Welcome Banner",
  });
  if (await dismissWelcome.isVisible().catch(() => false)) {
    await dismissWelcome.click();
  }
};

// ログイン後の購入フローを実行し、注文完了画面まで進める。
export const completeJuiceShopPurchase = async (page: Page) => {
  await stabilizeUi(page);

  // 在庫のある商品を明示的に追加して、Checkoutの有効化を待つ。
  await page
    .locator("mat-card")
    .filter({ hasText: "Lemon Juice (500ml)" })
    .getByRole("button", { name: "Add to Basket" })
    .click();

  await expect(page.getByRole("button", { name: "Show the shopping cart" })).toContainText("1");

  await page.getByRole("button", { name: "Show the shopping cart" }).click();
  const checkoutButton = page.getByRole("button", { name: "Checkout" });
  await expect(checkoutButton).toBeEnabled();
  await checkoutButton.click();
  await page.getByRole("button", { name: "Add a new address" }).click();

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

  const aliceAddressRow = page
    .locator("tr, mat-row")
    .filter({ hasText: /Alice/ });
  await aliceAddressRow.first().locator("mat-radio-button").first().click();
  await page.getByRole("button", { name: /Proceed|Continue/i }).click();

  const fastDeliveryRow = page
    .locator("tr, mat-row")
    .filter({ hasText: /Fast Delivery/ });
  await fastDeliveryRow.first().locator("mat-radio-button").first().click();
  await page.getByRole("button", { name: /Proceed|Continue/i }).click();

  const paymentMethodRow = page
    .locator("tr, mat-row")
    .filter({ hasText: /\/\d{4}$/ });
  await paymentMethodRow.first().locator("mat-radio-button").first().click();
  await page.getByRole("button", { name: /Proceed|Continue/i }).click();

  await page.getByRole("button", { name: "Complete your purchase" }).click();
};
