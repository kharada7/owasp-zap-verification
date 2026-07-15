import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { login } from "../pages/login";
import {
  closeBlockingOverlays,
  closeCookieBanner,
  dismissWelcomeBanner,
  openAccountMenuAndClickLogin,
  neutralizeCookieBanner,
} from "../testutil/juice-shop-playwright-util";

// ログイン後に Privacy & Security からパスワードを変更するシナリオ
test("change-password-from-privacy-security", async ({ page }) => {
  test.setTimeout(60000);

  const email = "jim@juice-sh.op";
  const originalPassword = "ncc-1701";
  const configuredCurrentPassword = (
    process.env.JUICE_SHOP_CURRENT_PASSWORD
    ?? (fs.existsSync(path.resolve("tests/files/currentpassword.txt"))
      ? fs.readFileSync(path.resolve("tests/files/currentpassword.txt"), "utf8")
      : "")
  ).trim();

  const newPassword = fs
    .readFileSync(path.resolve("tests/files/newpassword.txt"), "utf8")
    .trim();
  expect(newPassword.length).toBeGreaterThan(0);
  expect(newPassword).not.toBe(originalPassword);

  const currentPasswordField = page.getByRole("textbox", {
    name: "Field to enter the current password",
  });
  const newPasswordField = page.getByRole("textbox", {
    name: "Field for the new password",
  });
  const repeatNewPasswordField = page.getByRole("textbox", {
    name: "Field to repeat the new password",
  });

  const navigateToChangePassword = async () => {
    await page.getByRole("button", { name: "Show/hide account menu" }).click();
    await page
      .getByRole("menuitem", { name: "Show Privacy and Security Menu" })
      .click();
    await page
      .getByRole("menuitem", { name: "Go to change password page" })
      .click();
    await expect(page).toHaveURL(/#\/privacy-security\/change-password$/);
  };

  const submitPasswordChange = async (current: string, next: string) => {
    await currentPasswordField.fill(current);
    await newPasswordField.fill(next);
    await repeatNewPasswordField.fill(next);
    await page
      .getByRole("button", { name: "Button to confirm the change" })
      .click();

    // 成功時�EフォームがリセチE��される、E
    await expect(currentPasswordField).toHaveValue("");
    await expect(newPasswordField).toHaveValue("");
    await expect(repeatNewPasswordField).toHaveValue("");
  };

  const logoutIfPossible = async () => {
    await page.getByRole("button", { name: "Show/hide account menu" }).click().catch(() => {});
    await page.getByRole("menuitem", { name: "Logout" }).click().catch(() => {});
  };

  const loginToSearch = async (password: string) => {
    await page.goto("http://127.0.0.1:3000/#/login", {
      waitUntil: "domcontentloaded",
    });
    await login(page, email, password);
    try {
      await expect(page).toHaveURL(/#\/(search|\/search)$/, { timeout: 7000 });
      return true;
    } catch {
      return false;
    }
  };

  let activePassword = originalPassword;

  page.on("console", (msg) => {
    console.log(msg.text());
  });

  await page.setViewportSize({ width: 1280, height: 720 });

  await page.goto("http://127.0.0.1:3000/", { waitUntil: "domcontentloaded" });

  // Close cookie banner and neutralize its overlay if it keeps intercepting clicks.
  await closeCookieBanner(page);

  // Close welcome modal if shown.
  await dismissWelcomeBanner(page);

  await closeBlockingOverlays(page);

  // Open account menu and click login in overlay pane with retries.
  await openAccountMenuAndClickLogin(page);

  await expect(page).toHaveURL(/#\/login$/);

  // 直前実行�E影響を吸収するため、現時点の有効パスワードを判定する、E
  const candidatePasswords = [
    configuredCurrentPassword,
    originalPassword,
    newPassword,
  ].filter((value, index, list) => value.length > 0 && list.indexOf(value) === index);

  let matchedPassword: string | undefined;
  for (const candidate of candidatePasswords) {
    if (await loginToSearch(candidate)) {
      matchedPassword = candidate;
      break;
    }
  }

  if (matchedPassword) {
    activePassword = matchedPassword;
  } else {
    throw new Error(
      "Unable to login with known passwords. Set JUICE_SHOP_CURRENT_PASSWORD or tests/files/currentpassword.txt.",
    );
  }

  await neutralizeCookieBanner(page);

  try {
    // 既に新パスワード状態なら、�Eに允E��戻してチE��ト前提を揁E��る、E
    if (activePassword !== originalPassword) {
      await navigateToChangePassword();
      await submitPasswordChange(activePassword, originalPassword);
      activePassword = originalPassword;
      await logoutIfPossible();
      const canLoginWithOriginal = await loginToSearch(originalPassword);
      expect(canLoginWithOriginal).toBe(true);
      await neutralizeCookieBanner(page);
    }

    // 1回目: 既存パスワーチE-> 新規パスワード、E
    await navigateToChangePassword();
    await submitPasswordChange(originalPassword, newPassword);
    activePassword = newPassword;

    // 新しいパスワードで再ログインできることを確認、E
    await logoutIfPossible();
    const canLoginWithNew = await loginToSearch(newPassword);
    expect(canLoginWithNew).toBe(true);
    await neutralizeCookieBanner(page);
  } finally {
    // 2回目: 忁E��允E�Eパスワードに戻す、E
    if (activePassword !== originalPassword) {
      await logoutIfPossible();
      const canLoginWithActive = await loginToSearch(activePassword);
      expect(canLoginWithActive).toBe(true);
      await neutralizeCookieBanner(page);

      await navigateToChangePassword();
      await submitPasswordChange(activePassword, originalPassword);
      activePassword = originalPassword;
    }
  }
});
