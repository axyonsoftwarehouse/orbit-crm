import { expect, test } from "@playwright/test"

test("raiz redireciona para /login quando não autenticado", async ({
  page,
}) => {
  await page.goto("/")
  await expect(page).toHaveURL(/\/login/)
})

test("página de login mostra o formulário", async ({ page }) => {
  await page.goto("/login")
  await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible()
})
