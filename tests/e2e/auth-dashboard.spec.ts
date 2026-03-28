import { expect, test } from '@playwright/test';

const mockUser = {
  id: 'u-e2e',
  email: 'admin@casavidal.com',
  firstName: 'Admin',
  lastName: 'E2E',
  role: 'ADMIN',
};

async function mockApi(page: import('@playwright/test').Page) {
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { user: mockUser, token: 'e2e-token' },
      }),
    });
  });

  await page.route('**/api/dashboard/stats', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          salesToday: { total: 100, count: 1 },
          salesMonth: { total: 1000, count: 10 },
          totalClients: 50,
          lowStockCount: 3,
          pendingOrders: 2,
        },
      }),
    });
  });

  await page.route('**/api/dashboard/sales-trend**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });

  await page.route('**/api/dashboard/top-products**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });

  await page.route('**/api/dashboard/top-clients**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });

  await page.route('**/api/notifications**', async (route) => {
    const url = route.request().url();
    if (url.includes('unread-count')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { count: 0 } }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });
}

test.describe('Frontend auth flow', () => {
  test('redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Iniciar Sesión' })).toBeVisible();
  });

  test('dashboard is reachable with mocked API', async ({ page }) => {
    await mockApi(page);
    await page.goto('/dashboard');

    if (page.url().endsWith('/login')) {
      await expect(page.getByRole('heading', { name: 'Iniciar Sesión' })).toBeVisible();
      await page.locator('input[type="email"]').fill('admin@casavidal.com');
      await page.locator('input[type="password"]').fill('admin123');
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    }

    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
