import { Page } from "@playwright/test";

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

// アカウントメニューを開いてログインをクリックする。オーバーレイが邪魔している場合は閉じる。最大3回までリトライ。
export const openAccountMenuAndClickLogin = async (page: Page) => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    await closeBlockingOverlays(page);

    await page.locator("#navbarAccount").click({ timeout: 10000 });

    const loginInMenu = page.locator(".cdk-overlay-pane #navbarLoginButton").first();
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
