import { expect, test } from './fixtures'

// DoD 7: Rolle anlegen → kurzfristiges und langfristiges Ziel hinzufügen →
// beides erscheint getrennt.
test('Rolle mit kurz- und langfristigem Ziel anlegen', async ({ authedPage: page }) => {
  const role = `Testrolle ${Date.now()}`
  const shortGoal = 'Quartalsziel prüfen'
  const longGoal = 'Fünfjahresziel prüfen'

  await page.getByRole('link', { name: 'Rollen' }).filter({ visible: true }).click()
  await expect(page.getByRole('heading', { name: 'Rollen & Ziele' })).toBeVisible()

  await page.getByLabel('Neue Rolle').fill(role)
  await page.getByRole('button', { name: 'Anlegen' }).click()

  const card = page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: role }) })
  await expect(card).toBeVisible()

  await card.getByLabel(`Kurzfristig (dieses Quartal) für ${role} hinzufügen`).fill(shortGoal)
  await card.getByRole('button', { name: 'Ziel hinzufügen' }).first().click()

  await card.getByLabel(`Langfristig (1–5 Jahre) für ${role} hinzufügen`).fill(longGoal)
  await card.getByRole('button', { name: 'Ziel hinzufügen' }).last().click()

  // Getrennte Abschnitte: jedes Ziel steht unter der richtigen Überschrift.
  const shortSection = card.locator('section').filter({ hasText: 'Kurzfristig (dieses Quartal)' })
  const longSection = card.locator('section').filter({ hasText: 'Langfristig (1–5 Jahre)' })

  await expect(shortSection).toContainText(shortGoal)
  await expect(shortSection).not.toContainText(longGoal)
  await expect(longSection).toContainText(longGoal)
  await expect(longSection).not.toContainText(shortGoal)

  // Überlebt einen Reload.
  await page.reload()
  await expect(card).toContainText(shortGoal)
  await expect(card).toContainText(longGoal)

  // Aufräumen: Rolle archivieren, damit spätere Läufe sauber starten.
  await card.getByRole('button', { name: `${role} archivieren` }).click()
  await expect(card).toBeHidden()
})
