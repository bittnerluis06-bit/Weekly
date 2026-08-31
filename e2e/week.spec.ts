import { expect, test } from './fixtures'
import { startOfWeek, toISODate } from '../src/lib/date'

// Beide Tests arbeiten auf der Woche desselben Nutzers. Parallel in zwei
// Projekten würden sie sich gegenseitig die Daten unter den Füßen wegziehen,
// deshalb laufen sie nur im Mobile-Projekt (390x844, das Zielgerät).
test.describe.configure({ mode: 'serial' })

const monday = toISODate(startOfWeek(new Date()))

interface WeekRow {
  id: string
}

/** Woche auf Planungsstand zurücksetzen: Aktivitäten weg, Status `planning`. */
async function resetWeek(db: {
  select: <T>(path: string) => Promise<T>
  patch: (path: string, body: unknown) => Promise<void>
  remove: (path: string) => Promise<void>
}) {
  const weeks = await db.select<WeekRow[]>(`weeks?start_date=eq.${monday}&select=id`)
  const week = weeks[0]
  if (!week) return
  await db.remove(`week_items?week_id=eq.${week.id}`)
  await db.patch(`weeks?id=eq.${week.id}`, { status: 'planning' })
}

// DoD 8: Neue Woche planen — für 5 Rollen je 2 Aktivitäten, Quadrant setzen,
// auf Tage verteilen, Woche aktivieren.
test('Woche planen: je zwei Aktivitäten pro Rolle, verteilen, aktivieren', async ({
  authedPage: page,
  db,
}) => {
  test.skip(test.info().project.name !== 'mobile', 'Nur einmal ausführen — geteilte Daten.')
  await resetWeek(db)

  await page.getByRole('link', { name: 'Woche' }).filter({ visible: true }).click()
  await expect(page.getByRole('heading', { name: 'Woche planen' })).toBeVisible()

  // Schritt 1: Mission
  await expect(page.getByRole('heading', { name: 'Deine Mission' })).toBeVisible()
  await page.getByRole('button', { name: 'Weiter' }).click()

  // Schritt 2: je zwei Aktivitäten pro Rolle
  const roleCards = page.getByRole('listitem').filter({ has: page.getByRole('heading', { level: 2 }) })
  const roleCount = await roleCards.count()
  expect(roleCount).toBeGreaterThanOrEqual(5)

  for (let i = 0; i < roleCount; i++) {
    const card = roleCards.nth(i)
    const roleName = (await card.getByRole('heading', { level: 2 }).textContent())?.trim() ?? ''
    for (const suffix of ['A', 'B']) {
      await card.getByLabel(`Aktivität für ${roleName}`).fill(`${roleName} ${suffix}`)
      await card.getByRole('button', { name: 'Aktivität hinzufügen' }).click()
      await expect(card.getByText(`${roleName} ${suffix}`, { exact: true })).toBeVisible()
    }
  }

  // Quadrant der ersten Aktivität bewusst auf Q1 stellen
  const firstQuadrant = page.locator('select[id^="quadrant-"]').first()
  await firstQuadrant.selectOption('Q1')
  await expect(firstQuadrant).toHaveValue('Q1')

  await page.getByRole('button', { name: 'Weiter' }).click()

  // Schritt 3: alle Aktivitäten auf Tage verteilen
  const unplanned = page.getByRole('region', { name: /Noch keinem Tag zugeordnet/ })
  const total = roleCount * 2
  await expect(unplanned.locator('select')).toHaveCount(total)

  for (let i = 0; i < total; i++) {
    // Nach jeder Zuordnung verschwindet der Eintrag aus der Liste, also immer
    // wieder den ersten verbliebenen nehmen.
    await unplanned.locator('select').first().selectOption(String(i % 7))
    await expect(unplanned.locator('select')).toHaveCount(total - i - 1)
  }
  await expect(page.getByText('Alles verteilt.')).toBeVisible()

  await page.getByRole('button', { name: 'Weiter' }).click()

  // Schritt 4: Zusammenfassung und Aktivierung
  await expect(page.getByRole('heading', { name: 'Aktivitäten pro Rolle' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Verteilung über die Quadranten' })).toBeVisible()
  await page.getByRole('button', { name: 'Woche starten' }).click()

  await expect(page.getByRole('heading', { name: 'Diese Woche' })).toBeVisible()
  await expect(page.getByText('aktiv')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Diese Woche' })).toBeVisible()
})

// DoD 9: Fixtermine erscheinen automatisch an den richtigen Wochentagen.
test('Fixtermin aus den Einstellungen erscheint am richtigen Wochentag', async ({
  authedPage: page,
  db,
}) => {
  test.skip(test.info().project.name !== 'mobile', 'Nur einmal ausführen — geteilte Daten.')
  await resetWeek(db)
  // Rückstände abgebrochener Läufe entfernen, sonst gibt es mehrere Termine
  // mit derselben Zeitangabe.
  await db.remove('fixed_events?title=like.Testtermin%25')

  const title = `Testtermin ${Date.now()}`

  await page.getByRole('link', { name: 'Einstellungen' }).filter({ visible: true }).click()
  await expect(page.getByRole('heading', { name: 'Einstellungen' })).toBeVisible()

  await page.getByLabel('Titel').fill(title)
  await page.getByLabel('Wochentag').selectOption('2') // Mittwoch
  await page.getByLabel('Beginn').fill('17:15')
  await page.getByLabel('Ende').fill('19:00')
  await page.getByRole('button', { name: 'Hinzufügen' }).click()

  // An den eindeutigen Titel binden, nicht an die Zeitangabe.
  const entry = page.getByRole('listitem').filter({ hasText: title })
  await expect(entry).toBeVisible()
  await expect(entry).toContainText('Mittwoch · 17:15–19:00')

  // In der Wochenplanung steht er unter Mittwoch — und nur dort.
  await page.getByRole('link', { name: 'Woche' }).filter({ visible: true }).click()
  await page.getByRole('button', { name: 'Weiter' }).click()
  await page.getByRole('button', { name: 'Weiter' }).click()

  const wednesday = page.getByRole('listitem').filter({
    has: page.getByRole('heading', { name: 'Mittwoch' }),
  })
  await expect(wednesday).toContainText(title)
  await expect(wednesday).toContainText('17:15–19:00')

  const thursday = page.getByRole('listitem').filter({
    has: page.getByRole('heading', { name: 'Donnerstag' }),
  })
  await expect(thursday).not.toContainText(title)

  // Aufräumen
  await page.getByRole('link', { name: 'Einstellungen' }).filter({ visible: true }).click()
  await page.getByRole('button', { name: `${title} löschen` }).click()
  // exact, sonst trifft der Name auch den Papierkorb-Knopf „<Titel> löschen“.
  await page.getByRole('button', { name: 'Löschen', exact: true }).click()
  await expect(page.getByText(title)).toBeHidden()
})
