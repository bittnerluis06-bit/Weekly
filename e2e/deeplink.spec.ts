import { expect, test } from '@playwright/test'

// GitHub Pages kennt keine SPA-Routen: /Weekly/heute liefert 404.html, das den
// Pfad merkt und die App-Wurzel lädt. Der Test prüft, dass die Route danach
// wiederhergestellt ist — nicht der HTTP-Status, der bei Pages 404 bleibt.
test('Direkter Aufruf einer Unterroute landet auf der richtigen Route', async ({ page }) => {
  await page.goto('./heute')
  await expect(page).toHaveURL(/\/Weekly\/heute$/)
})
