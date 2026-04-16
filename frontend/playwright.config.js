import { defineConfig, devices } from '@playwright/test'
import { readFileSync } from 'fs'

// Load .env.test into process.env if the file exists
try {
  const lines = readFileSync(new URL('./.env.test', import.meta.url), 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const val = trimmed.slice(eqIndex + 1).trim()
    if (key && !(key in process.env)) process.env[key] = val
  }
} catch {
  // .env.test not present - env vars must be set externally
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 0,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    // Runs first: logs in and saves auth state to tests/.auth.json
    {
      name: 'setup',
      testMatch: '**/global.setup.js',
    },

    // Tests that require a logged-in user
    {
      name: 'authenticated',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/global.setup.js', '**/auth.spec.js', '**/modules.spec.js'],
    },

    // Tests that run without any stored session
    {
      name: 'unauthenticated',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/auth.spec.js', '**/modules.spec.js'],
    },
  ],

  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
    },
    {
      command: 'npm --prefix ../backend run dev',
      url: 'http://localhost:3000/modules',
      reuseExistingServer: true,
      env: { ...process.env, NODE_ENV: 'test' },
    },
  ],
})
