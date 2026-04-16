// US5 - View Progress, US6 - Continue Learning
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

// ----------------------------------------------------------------
// Authenticated tests
// ----------------------------------------------------------------

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('dashboard page loads with progress heading', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: /your progress/i })).toBeVisible({ timeout: 8000 })
})

test('dashboard shows lessons completed stat card', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByText(/lessons completed/i)).toBeVisible({ timeout: 8000 })
})

test('dashboard shows modules started stat card', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByText(/modules started/i)).toBeVisible({ timeout: 8000 })
})

test('dashboard shows overall progress bar', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByText(/overall progress/i)).toBeVisible({ timeout: 8000 })
})

test('dashboard shows a continue learning or start learning button', async ({ page }) => {
  await page.goto('/dashboard')
  const continueBtn = page.getByRole('button', { name: /continue learning/i })
  const startBtn = page.getByRole('button', { name: /start learning/i })
  const allDoneMsg = page.getByText(/all lessons complete/i)

  await expect(continueBtn.or(startBtn).or(allDoneMsg)).toBeVisible({ timeout: 8000 })
})

test('continue learning button navigates to a lesson', async ({ page }) => {
  await page.goto('/dashboard')
  const continueBtn = page.getByRole('button', { name: /continue learning/i })

  if (await continueBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await continueBtn.click()
    await expect(page).toHaveURL(/\/lessons\/\d+/, { timeout: 8000 })
  } else {
    test.skip()
  }
})

test('navbar shows Progress link when logged in', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByRole('link', { name: /progress/i })).toBeVisible()
})

// ----------------------------------------------------------------
// Unauthenticated redirect test (overrides the beforeEach login by
// clearing storage after login, then navigating fresh)
// ----------------------------------------------------------------

test('unauthenticated access to /dashboard redirects to /login', async ({ page, context }) => {
  // Clear everything so there is no session
  await context.clearCookies()
  await page.evaluate(() => localStorage.clear())

  await page.goto('/dashboard')
  await page.waitForURL('**/login', { timeout: 8000 })
  await expect(page).toHaveURL(/\/login/)
})
