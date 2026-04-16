import { test as setup, expect } from '@playwright/test'

const AUTH_FILE = 'tests/.auth.json'

setup('authenticate test user', async ({ page }) => {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD

  if (!email || !password) {
    throw new Error(
      'Missing PLAYWRIGHT_TEST_EMAIL or PLAYWRIGHT_TEST_PASSWORD environment variables.\n' +
      'Copy .env.test.example to .env.test and fill in a real Supabase test account.'
    )
  }

  await page.goto('/login')
  await expect(page.getByPlaceholder('you@example.com')).toBeVisible()

  await page.getByPlaceholder('you@example.com').fill(email)
  await page.getByPlaceholder('••••••••').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()

  await page.waitForURL('**/modules', { timeout: 10000 })

  await page.context().storageState({ path: AUTH_FILE })
})
