import { defineConfig, devices } from '@playwright/test'
import { loadEnv } from 'vite'

// Werte aus .env auch für den Test-Prozess verfügbar machen (Vite lädt sie nur
// für den Build). Bereits gesetzte Env-Variablen — etwa in CI — gewinnen.
for (const [key, value] of Object.entries(loadEnv('production', process.cwd(), ''))) {
  if (process.env[key] === undefined) process.env[key] = value
}

// E2E läuft gegen den Vite-Preview-Server unter der Pages-Base.
const PORT = 4173
const BASE = '/Weekly/'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'line' : 'html',
  use: {
    baseURL: `http://localhost:${PORT}${BASE}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}${BASE}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
