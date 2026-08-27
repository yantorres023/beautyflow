import { expect, test } from "@playwright/test";

test("presents the BeautyFlow landing page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Seu talento no centro. Sua gestão no fluxo." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Criar meu espaço" })).toHaveAttribute("href", "/cadastrar");
  await expect(page.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/entrar");
});
