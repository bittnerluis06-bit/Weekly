import { expect, test } from '@playwright/test'

test('Login-Screen wird gerendert', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Weekly Planner' })).toBeVisible()
  await expect(page.getByLabel('E-Mail-Adresse')).toBeVisible()
})

test('kein horizontales Scrollen', async ({ page }) => {
  await page.goto('./')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(overflow).toBe(false)
})

test('Absenden ist ohne E-Mail gesperrt, Touch-Target mindestens 44px', async ({ page }) => {
  await page.goto('./')
  const button = page.getByRole('button', { name: 'Magic Link senden' })
  await expect(button).toBeDisabled()

  const box = await button.boundingBox()
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)

  await page.getByLabel('E-Mail-Adresse').fill('test@example.com')

  // Ohne konfiguriertes Supabase bleibt der Button bewusst gesperrt.
  const demoMode = await page.getByText('Supabase ist nicht konfiguriert.').isVisible()
  if (demoMode) {
    await expect(button).toBeDisabled()
  } else {
    await expect(button).toBeEnabled()
  }
})
