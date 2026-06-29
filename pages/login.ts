import { Page } from "@playwright/test";

export const login = async (page: Page, email: string, password: string) => {
  await page
    .getByRole("textbox", { name: "Text field for the login email" })
    .fill(email);
  await page
    .getByRole("textbox", { name: "Text field for the login password" })
    .fill(password);
  await page.locator('button[id="loginButton"]').click();
};
