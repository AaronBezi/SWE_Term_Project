// US9 - Role-based access control, US11 - Admin CRUD
import { test, expect } from '@playwright/test'

// The stored session is for the regular test account (learner role by default).
// These tests verify that the admin panel correctly enforces role-based access.
// If PLAYWRIGHT_ADMIN_EMAIL / PLAYWRIGHT_ADMIN_PASSWORD are provided, the
// admin-specific CRUD tests will also run.

async function loginAsRegularUser(page) {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD
  if (!email || !password) { test.skip(); return }
  await page.goto('/login')
  await page.getByPlaceholder('you@example.com').fill(email)
  await page.getByPlaceholder('••••••••').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/modules', { timeout: 10000 })
}

test.beforeEach(async ({ page }) => {
  await loginAsRegularUser(page)
})

// ----------------------------------------------------------------
// Access control (US9)
// ----------------------------------------------------------------

test('non-admin user sees access denied on /admin', async ({ page }) => {
  await page.goto('/admin')
  // The admin panel checks app_metadata.role - a learner account should be blocked
  await expect(page.getByText(/access denied/i)).toBeVisible({ timeout: 8000 })
})

test('admin link is not visible in navbar for non-admin user', async ({ page }) => {
  await page.goto('/modules')
  // The Admin nav link only renders when isAdmin is true
  const adminLink = page.getByRole('link', { name: /admin/i })
  await expect(adminLink).toHaveCount(0)
})

test('unauthenticated access to /admin redirects to /login', async ({ page, context }) => {
  await context.clearCookies()
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())

  await page.goto('/admin')
  // AdminPanel navigates to /login when there is no session
  await page.waitForURL('**/login', { timeout: 8000 })
  await expect(page).toHaveURL(/\/login/)
})

// ----------------------------------------------------------------
// Admin panel UI - only runs when an admin account is configured (US11)
// ----------------------------------------------------------------

test.describe('admin panel (requires PLAYWRIGHT_ADMIN_EMAIL)', () => {
  test.beforeEach(async ({ page }) => {
    const adminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL
    const adminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD
    if (!adminEmail || !adminPassword) {
      test.skip()
      return
    }

    // Log in as admin
    await page.goto('/login')
    await page.getByPlaceholder('you@example.com').fill(adminEmail)
    await page.getByPlaceholder('••••••••').fill(adminPassword)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/modules', { timeout: 10000 })
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: /admin panel/i })).toBeVisible({ timeout: 8000 })
  })

  test('admin panel shows modules, lessons, and users tabs', async ({ page }) => {
    await expect(page.getByRole('button', { name: /modules/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /lessons/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /users/i })).toBeVisible()
  })

  test('admin can create and then delete a module', async ({ page }) => {
    const testTitle = `Playwright Test Module ${Date.now()}`
    // Use a high random order_index to avoid conflicts with existing modules
    const orderIndex = String(9000 + (Date.now() % 999))

    // Add module
    await page.getByRole('button', { name: /\+ add module/i }).click()
    await page.getByPlaceholder('Title').fill(testTitle)
    await page.getByPlaceholder('Order').fill(orderIndex)
    await page.getByRole('button', { name: /^create$/i }).click()

    await expect(page.getByText(testTitle)).toBeVisible({ timeout: 8000 })

    // Wire up the confirm dialog handler BEFORE clicking delete
    page.on('dialog', dialog => dialog.accept())

    const moduleRow = page.locator(`text=${testTitle}`).locator('xpath=ancestor::div[contains(@class,"rounded-xl")]')
    await moduleRow.getByRole('button', { name: /delete/i }).click()

    await expect(page.getByText(testTitle)).toHaveCount(0, { timeout: 8000 })
  })

  test('admin users tab lists at least one user', async ({ page }) => {
    await page.getByRole('button', { name: /users/i }).click()
    // Wait for users to load (fetched async after tab click)
    await expect(page.locator('table')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 8000 })
  })

  test('admin navbar shows Admin link', async ({ page }) => {
    await expect(page.getByRole('link', { name: /admin/i })).toBeVisible()
  })
})
