// US4 - Prerequisite enforcement, US10 - View lesson content
import { test, expect } from '@playwright/test'

async function login(page) {
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
  await login(page)
})

// ----------------------------------------------------------------
// Authenticated lesson tests
// ----------------------------------------------------------------

test('authenticated user can navigate to a lesson from the modules page', async ({ page }) => {
  await page.goto('/modules')
  await expect(page.getByText('Your Learning Journey')).toBeVisible({ timeout: 8000 })

  const cta = page.getByRole('button', { name: /start module|continue/i }).first()
  await cta.click()
  await expect(page).toHaveURL(/\/lessons\/\d+/, { timeout: 8000 })
})

test('lesson view shows lesson title and content area', async ({ page }) => {
  await page.goto('/modules')
  await expect(page.getByText('Your Learning Journey')).toBeVisible({ timeout: 8000 })

  await page.getByRole('button', { name: /start module|continue/i }).first().click()
  await expect(page).toHaveURL(/\/lessons\/\d+/, { timeout: 8000 })

  await expect(page.locator('h1').first()).toBeVisible({ timeout: 8000 })
  await expect(page.locator('.whitespace-pre-wrap').first()).toBeVisible()
})

test('lesson view shows Mark as Complete button', async ({ page }) => {
  await page.goto('/modules')
  await expect(page.getByText('Your Learning Journey')).toBeVisible({ timeout: 8000 })

  await page.getByRole('button', { name: /start module|continue/i }).first().click()
  await expect(page).toHaveURL(/\/lessons\/\d+/, { timeout: 8000 })

  const markComplete = page.getByRole('button', { name: /mark as complete/i })
  const alreadyDone = page.getByText(/lesson complete/i)
  await expect(markComplete.or(alreadyDone)).toBeVisible({ timeout: 8000 })
})

test('marking a lesson complete shows the success state', async ({ page }) => {
  await page.goto('/modules')
  await expect(page.getByText('Your Learning Journey')).toBeVisible({ timeout: 8000 })

  await page.getByRole('button', { name: /start module|continue/i }).first().click()
  await expect(page).toHaveURL(/\/lessons\/\d+/, { timeout: 8000 })

  const markComplete = page.getByRole('button', { name: /mark as complete/i })
  const alreadyDone = page.getByText(/lesson complete/i)

  // Wait for the page to finish loading — either element confirms it
  await expect(markComplete.or(alreadyDone)).toBeVisible({ timeout: 8000 })

  if (await markComplete.isVisible()) {
    await markComplete.click()
    await expect(alreadyDone).toBeVisible({ timeout: 8000 })
    await expect(page.getByRole('button', { name: 'Back to modules →' })).toBeVisible()
  } else {
    await expect(alreadyDone).toBeVisible()
  }
})

test('locked modules do not show navigable lesson rows', async ({ page }) => {
  await page.goto('/modules')
  await expect(page.getByText('Your Learning Journey')).toBeVisible({ timeout: 8000 })

  const lockIcon = page.getByText('🔒').first()
  if (await lockIcon.isVisible({ timeout: 3000 }).catch(() => false)) {
    // Locked modules render without lesson rows or CTA buttons
    const lockedCard = lockIcon.locator('xpath=ancestor::div[contains(@class,"rounded-2xl")]')
    await expect(lockedCard.getByRole('button', { name: /start module|continue/i })).toHaveCount(0)
  } else {
    test.skip()
  }
})

// ----------------------------------------------------------------
// Unauthenticated redirect (clears session that beforeEach created)
// ----------------------------------------------------------------

test('unauthenticated access to a lesson redirects to login', async ({ page, context }) => {
  await context.clearCookies()
  await page.evaluate(() => localStorage.clear())

  await page.goto('/lessons/1')
  await page.waitForURL('**/login', { timeout: 8000 })
  await expect(page).toHaveURL(/\/login/)
})
