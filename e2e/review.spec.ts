import { expect, test, type Db } from './fixtures'
import { addDays, startOfWeek, toISODate } from '../src/lib/date'

test.describe.configure({ mode: 'serial' })

const thisMonday = startOfWeek(new Date())
const lastMonday = toISODate(addDays(thisMonday, -7))
const currentMonday = toISODate(thisMonday)

interface WeekRow {
  id: string
}
interface RoleRow {
  id: string
  name: string
}

/**
 * Legt eine abgeschlossene Vorwoche mit bekannter Bilanz an:
 * Rolle A — 2 Aktivitäten, 1 erledigt (Q2) · Rolle B — 2 Aktivitäten, beide erledigt (Q1, Q2).
 * Erwartung: gesamt 3 von 4 = 75 %, Q1 = 1, Q2 = 2.
 */
async function seedLastWeek(db: Db) {
  await db.remove(`weeks?start_date=eq.${lastMonday}`)

  await db.post('weeks', { start_date: lastMonday, status: 'active' })
  const weeks = await db.select<WeekRow[]>(`weeks?start_date=eq.${lastMonday}&select=id`)
  const week = weeks[0]!

  const roles = await db.select<RoleRow[]>('roles?archived=eq.false&select=id,name&order=sort_order')
  const [roleA, roleB] = roles
  if (!roleA || !roleB) throw new Error('Mindestens zwei Rollen nötig.')

  await db.post('week_items', [
    { week_id: week.id, role_id: roleA.id, title: 'A erledigt', quadrant: 'Q2', done: true, planned_day: 0 },
    { week_id: week.id, role_id: roleA.id, title: 'A offen', quadrant: 'Q3', done: false, planned_day: 1 },
    { week_id: week.id, role_id: roleB.id, title: 'B erledigt eins', quadrant: 'Q1', done: true, planned_day: 2 },
    { week_id: week.id, role_id: roleB.id, title: 'B erledigt zwei', quadrant: 'Q2', done: true, planned_day: 3 },
  ])

  return { week, roleA, roleB }
}

// DoD 13: Ohne Review lässt sich keine neue Woche starten; der Hinweis erscheint.
test('Ohne Review der Vorwoche keine neue Planung', async ({ authedPage: page, db }) => {
  test.skip(test.info().project.name !== 'mobile', 'Nur einmal ausführen — geteilte Daten.')
  await seedLastWeek(db)
  await db.remove(`weeks?start_date=eq.${currentMonday}`)

  // Direkt laden: der Tab-Klick würde nur bei einem Routenwechsel neu laden.
  await page.goto('./woche')

  const hint = page.getByRole('alert')
  await expect(hint).toContainText('Zuerst die Vorwoche abschließen')
  await expect(page.getByRole('link', { name: 'Zum Wochenreview' })).toBeVisible()

  // Der Schritt-Ablauf ist nicht erreichbar.
  await expect(page.getByRole('button', { name: 'Weiter' })).toBeHidden()
})

// DoD 12: Review ausfüllen → Kennzahlen werden korrekt berechnet.
test('Review berechnet Quote gesamt, pro Rolle und Quadranten', async ({ authedPage: page, db }) => {
  test.skip(test.info().project.name !== 'mobile', 'Nur einmal ausführen — geteilte Daten.')
  const { week, roleA, roleB } = await seedLastWeek(db)
  await db.remove(`weeks?start_date=eq.${currentMonday}`)

  await page.goto(`./review/${week.id}`)
  await expect(page.getByRole('heading', { name: 'Wochenreview' })).toBeVisible()

  // 3 von 4 erledigt
  await expect(page.getByTestId('rate-total')).toHaveText('75 %')
  await expect(page.getByText('3 von 4 Aktivitäten')).toBeVisible()

  // Pro Rolle
  const perRole = page.getByRole('heading', { name: 'Pro Rolle' }).locator('..')
  await expect(perRole.getByText(roleA.name).locator('..')).toContainText('1/2 · 50 %')
  await expect(perRole.getByText(roleB.name).locator('..')).toContainText('2/2 · 100 %')

  // Nur erledigte Aktivitäten zählen in die Quadrantenverteilung.
  await expect(page.getByTestId('done-Q1')).toHaveText('1')
  await expect(page.getByTestId('done-Q2')).toHaveText('2')
  await expect(page.getByTestId('done-Q3')).toHaveText('0')
  await expect(page.getByTestId('done-Q4')).toHaveText('0')

  // Pflichtformular: leeres Absenden wird abgewiesen.
  await page.getByRole('button', { name: 'Review abschließen' }).click()
  await expect(page.getByRole('alert')).toContainText('Bitte alle vier Felder ausfüllen')

  await page.getByLabel('Was lief gut?').fill('Zwei Läufe geschafft')
  await page.getByLabel('Was lief nicht?').fill('Zu spät ins Bett')
  await page.getByLabel('Was nimmst du mit?').fill('Abends früher runterfahren')
  await page.getByLabel('Fokus für nächste Woche').fill('Schlaf')
  await page.getByRole('radio', { name: '4 von 5' }).check()
  await page.getByRole('button', { name: 'Review abschließen' }).click()

  // Danach ist die Planung wieder offen.
  await expect(page.getByRole('heading', { name: 'Woche planen' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Rückblick auf die Vorwoche' })).toBeVisible()
  await expect(page.getByText('Zwei Läufe geschafft')).toBeVisible()
  await expect(page.getByText('4 von 5')).toBeVisible()
})
