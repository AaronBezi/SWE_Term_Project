// US3 - Browse Modules, US12 - Module locked/unlocked visual states
import { test, expect } from '@playwright/test'

test('modules page loads and shows at least one module', async ({ page }) => {
  await page.goto('/modules')
  await expect(page.getByText('Your Learning Journey')).toBeVisible({ timeout: 10000 })
  // Wait for at least one module card to render
  await expect(page.locator('.rounded-2xl').first()).toBeVisible({ timeout: 8000 })
})

test('page heading and subtitle are present', async ({ page }) => {
  await page.goto('/modules')
  await expect(page.getByText('Your Learning Journey')).toBeVisible()
  await expect(page.getByText(/complete each module in order/i)).toBeVisible()
})

test('first module is unlocked and shows a call-to-action button', async ({ page }) => {
  await page.goto('/modules')
  // First module is always unlocked - it shows either "Start Module →" or "Continue →"
  await expect(
    page.getByRole('button', { name: /start module|continue/i }).first()
  ).toBeVisible({ timeout: 8000 })
})

test('modules beyond the first are locked for a user with no progress', async ({ page }) => {
  // Without a session there is no progress, so all modules after the first are locked
  await page.goto('/modules')
  // The lock emoji appears on any module whose previous module is not fully completed
  await expect(page.getByText('🔒').first()).toBeVisible({ timeout: 8000 })
})

test('clicking a lesson row navigates to the lesson view', async ({ page }) => {
  await page.goto('/modules')
  // Wait for the page heading - more reliable than a CSS class selector
  await expect(page.getByText('Your Learning Journey')).toBeVisible({ timeout: 10000 })
  // Wait for at least one lesson row to appear
  const lessonRow = page.locator('text=Start →').first()
  await expect(lessonRow).toBeVisible({ timeout: 8000 })
  await lessonRow.click()
  // Without a session the lesson page redirects to /login
  await expect(page).toHaveURL(/\/(lessons\/\d+|login)/, { timeout: 8000 })
})

test('navbar shows Learn link on modules page', async ({ page }) => {
  await page.goto('/modules')
  await expect(page.getByRole('link', { name: 'Learn', exact: true })).toBeVisible()
})
