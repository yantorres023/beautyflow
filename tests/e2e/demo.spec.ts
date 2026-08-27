import { expect, test } from "@playwright/test";

test("allows visitors to explore the demo without an account", async ({ page }) => {
  await page.goto("/demo");

  await expect(page.getByRole("heading", { name: "Seu negócio em fluxo." })).toBeVisible();
  await expect(page.getByText("Modo demonstração")).toBeVisible();
  await expect(page.getByRole("link", { name: "Começar de verdade" })).toHaveAttribute("href", "/cadastrar");

  await page.getByRole("button", { name: "Clientes", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Clientes", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Agenda", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Agenda", exact: true })).toBeVisible();
});
