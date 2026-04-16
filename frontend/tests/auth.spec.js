// US1 - User Registration, US2 - Login / Logout
import { test, expect } from '@playwright/test'

// ----------------------------------------------------------------
// Signup (US1)
// ----------------------------------------------------------------

test('signup page renders form fields', async ({ page }) => {
  await page.goto('/signup')
  await expect(page.getByPlaceholder('you@example.com')).toBeVisible()
  await expect(page.getByPlaceholder('At least 6 characters')).toBeVisible()
  await expect(page.getByRole('button', { name: /create account/i })).toBeVisible()
})

test('signup with a new email shows email confirmation screen', async ({ page }) => {
  await page.goto('/signup')

  const uniqueEmail = `playwright+${Date.now()}@mailinator.com`
  await page.getByPlaceholder('you@example.com').fill(uniqueEmail)
  await page.getByPlaceholder('At least 6 characters').fill('testpassword123')
  await page.getByRole('button', { name: /create account/i }).click()

  // Supabase shows the confirmation screen when email confirmation is enabled.
  // If confirmation is disabled, the user gets logged in and redirected instead.
  // Either outcome means signup worked correctly.
  const confirmationScreen = page.getByText(/check your email/i)
  const errorMsg = page.locator('p.text-red-500')

  await expect(confirmationScreen.or(errorMsg)).toBeVisible({ timeout: 10000 })

  const errorVisible = await errorMsg.isVisible()
  if (errorVisible) {
    const msg = await errorMsg.textContent() ?? ''
    if (/rate limit/i.test(msg)) {
      // Supabase caps signup frequency - skip rather than fail the suite
      test.skip()
      return
    }
    throw new Error(`Signup returned an unexpected error: ${msg}`)
  }
})

test('signup page links to login page', async ({ page }) => {
  await page.goto('/signup')
  // Use the link inside the form footer, not the one in the navbar
  await page.locator('p').getByRole('link', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/login/)
})

// ----------------------------------------------------------------
// Login (US2)
// ----------------------------------------------------------------

test('login page renders form fields', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByPlaceholder('you@example.com')).toBeVisible()
  await expect(page.getByPlaceholder('••••••••')).toBeVisible()
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
})

test('login with wrong password shows an error', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('you@example.com').fill('wrong@example.com')
  await page.getByPlaceholder('••••••••').fill('wrongpassword')
  await page.getByRole('button', { name: /sign in/i }).click()

  // Supabase returns an error message for invalid credentials
  await expect(page.locator('p.text-red-500')).toBeVisible({ timeout: 8000 })
})

test('login with valid credentials redirects to /modules', async ({ page }) => {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD
  if (!email || !password) test.skip()

  await page.goto('/login')
  await page.getByPlaceholder('you@example.com').fill(email)
  await page.getByPlaceholder('••••••••').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()

  await page.waitForURL('**/modules', { timeout: 10000 })
  await expect(page).toHaveURL(/\/modules/)
})

test('login page links to signup page', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('link', { name: /sign up free/i }).click()
  await expect(page).toHaveURL(/\/signup/)
})

// ----------------------------------------------------------------
// Logout (US2)
// ----------------------------------------------------------------

test('after login the sign out button is visible in navbar', async ({ page }) => {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD
  if (!email || !password) test.skip()

  await page.goto('/login')
  await page.getByPlaceholder('you@example.com').fill(email)
  await page.getByPlaceholder('••••••••').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/modules', { timeout: 10000 })

  await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible()
})

test('clicking sign out redirects to /login', async ({ page }) => {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD
  if (!email || !password) test.skip()

  await page.goto('/login')
  await page.getByPlaceholder('you@example.com').fill(email)
  await page.getByPlaceholder('••••••••').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/modules', { timeout: 10000 })

  await page.getByRole('button', { name: /sign out/i }).click()
  await page.waitForURL('**/login', { timeout: 8000 })
  await expect(page).toHaveURL(/\/login/)
})
