import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { ProductsPage } from './pages/ProductsPage';

test.describe('Sales flow with mocked APIs (POM)', () => {
  test.afterEach(async ({ page }, testInfo) => {
    const safeTitle = testInfo.title.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
    await page.screenshot({
      path: `test-results/screenshots/${safeTitle}.png`,
      fullPage: true,
    });
  });

  test('logs in, visits /sales, creates product, and validates success signal', async ({ page }) => {
    let productCreated = false;
    const categoryId = '11111111-1111-1111-1111-111111111111';

    await page.route('**/*', async (route) => {
      const { pathname } = new URL(route.request().url());
      if (!pathname.startsWith('/api/')) {
        await route.fallback();
        return;
      }

      if (pathname === '/api/auth/login') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              token: 'mock-token',
              user: {
                id: 'u1',
                firstName: 'QA',
                lastName: 'User',
                role: 'ADMIN',
                email: 'admin@casavidal.com',
              },
            },
          }),
        });
        return;
      }

      if (pathname === '/api/dashboard/stats') {
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
        return;
      }

      if (
        pathname === '/api/dashboard/sales-trend' ||
        pathname === '/api/dashboard/top-products' ||
        pathname === '/api/dashboard/top-clients'
      ) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] }),
        });
        return;
      }

      if (pathname === '/api/notifications/unread-count') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { count: 0 } }),
        });
        return;
      }

      if (pathname.startsWith('/api/notifications')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] }),
        });
        return;
      }

      if (pathname.startsWith('/api/sales')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
          }),
        });
        return;
      }

      if (pathname === '/api/categories') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{ id: categoryId, name: 'Herramientas' }],
          }),
        });
        return;
      }

      if (pathname.startsWith('/api/products') && route.request().method() === 'POST') {
        productCreated = true;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Producto creado exitosamente',
            data: { id: 'p-1' },
          }),
        });
        return;
      }

      if (pathname === '/api/products') {
        const data = productCreated
          ? [
              {
                id: 'p-1',
                name: 'Producto E2E QA',
                sku: 'E2E-SKU-001',
                salePrice: 15,
                costPrice: 10,
                currentStock: 5,
                minStock: 1,
                isActive: true,
                category: { id: categoryId, name: 'Herramientas' },
                createdAt: new Date().toISOString(),
              },
            ]
          : [];

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data,
            pagination: { page: 1, limit: 10, total: data.length, totalPages: 1 },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} }),
      });
    });

    const loginPage = new LoginPage(page);
    const productsPage = new ProductsPage(page);

    await loginPage.goto();
    await loginPage.login('admin@casavidal.com', 'admin123');

    await page.getByRole('link', { name: /ventas/i }).click();
    await expect(page).toHaveURL(/\/sales$/);

    await productsPage.openFromSidebar();
    await productsPage.clickNewProduct();
    await productsPage.createProduct();
    await expect(page).toHaveURL(/\/products$/);
  });
});

