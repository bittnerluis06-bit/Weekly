import { expect, test } from './fixtures'

// DoD 6: Mission anlegen → speichern → neu laden → Inhalt ist da →
// bearbeiten → alte Version ist wiederherstellbar.
test('Mission speichern, neu laden und alte Version wiederherstellen', async ({ authedPage: page }) => {
  const first = `Erste Fassung ${Date.now()}`
  const second = `Zweite Fassung ${Date.now()}`

  // Auf Mobile trägt die Tab-Leiste den Link, auf Desktop die Sidebar.
  await page.getByRole('link', { name: 'Mission' }).filter({ visible: true }).click()
  await expect(page.getByRole('heading', { name: 'Mission', level: 1 })).toBeVisible()

  // Erste Fassung speichern
  await page.getByRole('button', { name: 'Bearbeiten' }).click()
  await page.getByLabel('Mission (Markdown)').fill(`# Mission\n\n${first}`)
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByTestId('mission-content')).toContainText(first)

  // Reload — Inhalt ist da
  await page.reload()
  await expect(page.getByTestId('mission-content')).toContainText(first)

  // Zweite Fassung speichern
  await page.getByRole('button', { name: 'Bearbeiten' }).click()
  await page.getByLabel('Mission (Markdown)').fill(`# Mission\n\n${second}`)
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByTestId('mission-content')).toContainText(second)
  await expect(page.getByTestId('mission-content')).not.toContainText(first)

  // Alte Fassung wiederherstellen
  await page.getByRole('button', { name: /^Versionen/ }).click()
  const history = page.getByRole('region', { name: 'Versionshistorie' })
  await history
    .getByRole('listitem')
    .filter({ hasText: first })
    .first()
    .getByRole('button', { name: 'Wiederherstellen' })
    .click()

  await expect(page.getByTestId('mission-content')).toContainText(first)
  await page.reload()
  await expect(page.getByTestId('mission-content')).toContainText(first)
})
