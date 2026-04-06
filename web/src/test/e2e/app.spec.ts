import { test, expect } from '@playwright/test'

test.describe('Auth Flow', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Panelim')).toBeVisible()
  })

  test('should show validation errors', async ({ page }) => {
    await page.goto('/login')

    await page.click('button[type="submit"]')

    await expect(page.locator('text=Email gerekli')).toBeVisible()
    await expect(page.locator('text=Şifre gerekli')).toBeVisible()
  })
})

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock login
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'mock_token')
    })
  })

  test('should display stats cards', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page.locator('text=Doğruluk Oranı')).toBeVisible()
    await expect(page.locator('text=Seviye')).toBeVisible()
    await expect(page.locator('text=Streak')).toBeVisible()
  })

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/dashboard')

    await page.click('text=Ders Analizi')
    await expect(page.locator('canvas')).toBeVisible()

    await page.click('text=İlerleme')
    await expect(page.locator('canvas')).toBeVisible()
  })
})

test.describe('Exam System', () => {
  test('should detect tab switch', async ({ page, context }) => {
    await page.goto('/exam/1')

    // Open new tab
    const newPage = await context.newPage()
    await newPage.goto('https://google.com')

    // Go back to exam
    await page.bringToFront()

    // Should show warning
    await expect(page.locator('text=Sekme değiştirme tespit edildi')).toBeVisible()
  })

  test('should show timer countdown', async ({ page }) => {
    await page.goto('/exam/1')

    const timer = page.locator('[class*="font-mono"]')
    await expect(timer).toBeVisible()

    // Wait and check timer decreased
    const initialTime = await timer.textContent()
    await page.waitForTimeout(2000)
    const newTime = await timer.textContent()

    expect(initialTime).not.toBe(newTime)
  })
})

test.describe('Video Player', () => {
  test('should play video', async ({ page }) => {
    await page.goto('/course/1/lesson/1')

    await page.click('button[aria-label="Oynat"]')

    // Check video is playing
    const video = page.locator('video')
    await expect(video).not.toHaveAttribute('paused')
  })

  test('should show watermark', async ({ page }) => {
    await page.goto('/course/1/lesson/1')

    const watermark = page.locator('[class*="watermark"]')
    await expect(watermark).toBeVisible()
    await expect(watermark).toHaveCSS('opacity', /0\.\d+/)
  })
})

test.describe('3D Library', () => {
  test('should render 3D scene', async ({ page }) => {
    await page.goto('/library')

    // Wait for Three.js canvas
    await page.waitForSelector('canvas')

    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
  })

  test('should show book info on hover', async ({ page }) => {
    await page.goto('/library')

    // Hover over book (this is simplified, actual 3D interaction harder to test)
    await page.mouse.move(400, 300)
    await page.waitForTimeout(500)

    // Check if tooltip appears
    await expect(page.locator('text=İlerleme')).toBeVisible({ timeout: 2000 })
  })
})

test.describe('Accessibility', () => {
  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/dashboard')

    // Tab through focusable elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement)
  })

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/dashboard')

    const buttons = await page.locator('button[aria-label]').count()
    expect(buttons).toBeGreaterThan(0)
  })

  test('should work in high contrast mode', async ({ page }) => {
    await page.goto('/dashboard')

    await page.evaluate(() => {
      document.documentElement.classList.add('high-contrast')
    })

    // Check contrast is applied
    const bgColor = await page.locator('body').evaluate((el) => 
      window.getComputedStyle(el).backgroundColor
    )

    expect(bgColor).toBe('rgb(0, 0, 0)')
  })
})

test.describe('Performance', () => {
  test('should load in under 3 seconds', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/dashboard')
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(3000)
  })

  test('should have good Lighthouse scores', async ({ page }) => {
    await page.goto('/dashboard')

    const metrics = await page.evaluate(() => ({
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
      lcp: performance.getEntriesByType('largest-contentful-paint').pop()?.startTime,
    }))

    expect(metrics.fcp).toBeLessThan(1800)
    expect(metrics.lcp).toBeLessThan(2500)
  })
})
