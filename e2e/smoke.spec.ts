import { test, expect } from '@playwright/test'

test.describe('Playwright E2E Smoke Suite: Local Productivity Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
  })

  test('loads dashboard and navigates across all core modules via sidebar', async ({ page, isMobile }) => {
    if (isMobile) {
      test.skip()
    }

    // 1. Dashboard is default landing view
    await expect(page.locator('header h1')).toHaveText('Dashboard')
    await expect(page.getByText('Daily Score', { exact: true })).toBeVisible()

    // 2. Navigate to Habits
    const sidebar = page.locator('aside')
    await sidebar.getByRole('button', { name: 'Habits' }).click()
    await expect(page).toHaveURL(/.*#\/habits/)
    await expect(page.locator('header h1')).toHaveText('Habits')

    // 3. Navigate to Tasks
    await sidebar.getByRole('button', { name: 'Tasks' }).click()
    await expect(page).toHaveURL(/.*#\/tasks/)
    await expect(page.locator('header h1')).toHaveText('Tasks')

    // 4. Navigate to Notes
    await sidebar.getByRole('button', { name: 'Notes' }).click()
    await expect(page).toHaveURL(/.*#\/notes/)
    await expect(page.locator('header h1')).toHaveText('Notes')

    // 5. Navigate to Settings
    await sidebar.getByRole('button', { name: 'Settings' }).click()
    await expect(page).toHaveURL(/.*#\/settings/)
    await expect(page.locator('header h1')).toHaveText('Settings')
  })

  test('creates task and note, and confirms persistence across browser page reload', async ({ page }) => {
    // 1. Navigate to Tasks
    await page.goto('/#/tasks')
    await page.getByRole('button', { name: 'New Task' }).click()

    // Fill task title in modal
    const taskInput = page.getByPlaceholder('What needs to be done?')
    await taskInput.fill('Playwright Verified Task')
    await page.getByRole('button', { name: 'Create Task' }).click()

    // Verify task appears on Tasks view
    await expect(page.getByText('Playwright Verified Task')).toBeVisible()

    // 2. Navigate to Notes and create a note
    await page.goto('/#/notes')
    await page.getByRole('button', { name: 'New Note' }).click()

    const noteTitleInput = page.getByPlaceholder('Note title...')
    await noteTitleInput.fill('Playwright Smoke Note')
    const noteContent = page.getByPlaceholder('Write your note here in Markdown format...')
    await noteContent.fill('# Playwright Testing\n\nVerified persistence in real IndexedDB.')

    // Save and close editor
    await page.getByRole('button', { name: /Save/i }).click()
    await page.getByTitle('Close Editor').click()

    // Verify note appears on Notes view
    await expect(page.getByText('Playwright Smoke Note')).toBeVisible()

    // 3. Reload browser page to test true IndexedDB persistence
    await page.reload()
    await page.waitForLoadState('domcontentloaded')

    // Confirm note still exists after reload
    await expect(page.getByText('Playwright Smoke Note')).toBeVisible()

    // Navigate to Tasks and confirm task still exists after reload
    await page.goto('/#/tasks')
    await expect(page.getByText('Playwright Verified Task')).toBeVisible()
  })

  test('opens and interacts with global Command Palette', async ({ page }) => {
    // Press Cmd+K / Ctrl+K
    const isMac = process.platform === 'darwin'
    await page.keyboard.press(isMac ? 'Meta+k' : 'Control+k')

    // Verify Command Palette input opens
    const searchInput = page.getByPlaceholder(/Type a command, jump to task/i)
    await expect(searchInput).toBeVisible()

    // Filter for Settings
    await searchInput.fill('Settings')
    await expect(page.getByText('Go to Settings')).toBeVisible()

    // Press Enter to navigate
    await searchInput.press('Enter')
    await expect(page).toHaveURL(/.*#\/settings/)
    await expect(page.locator('header h1')).toHaveText('Settings')
  })

  test('renders responsive bottom navigation on mobile viewports', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip()
    }

    // On mobile, bottom navigation is visible
    const bottomNav = page.locator('nav[aria-label="Mobile navigation"]')
    await expect(bottomNav).toBeVisible()

    // Tap Tasks in bottom nav
    await bottomNav.getByRole('button', { name: 'Tasks' }).click()
    await expect(page).toHaveURL(/.*#\/tasks/)
    await expect(page.locator('header h1')).toHaveText('Tasks')

    // Tap Notes in bottom nav
    await bottomNav.getByRole('button', { name: 'Notes' }).click()
    await expect(page).toHaveURL(/.*#\/notes/)
    await expect(page.locator('header h1')).toHaveText('Notes')
  })
})
