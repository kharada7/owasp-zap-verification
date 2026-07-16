import { expect, Page } from "@playwright/test";

export const login = async (page: Page, email: string, password: string) => {
  const emailField = page.getByRole("textbox", {
    name: "Text field for the login email",
  });
  const passwordField = page.getByRole("textbox", {
    name: "Text field for the login password",
  });

  await expect(emailField).toBeVisible({ timeout: 15000 });
  await expect(passwordField).toBeVisible({ timeout: 15000 });

  await emailField.fill(email);
  await passwordField.fill(password);
  await page.locator('button[id="loginButton"]').click();
};
