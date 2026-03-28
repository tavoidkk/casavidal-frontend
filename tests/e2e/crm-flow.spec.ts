import { expect, test } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { CRMPage } from './pages/CRMPage';

test.describe('CRM flow with mocked APIs', () => {
  test.afterEach(async ({ page }, testInfo) => {
    const safeTitle = testInfo.title.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
    await page.screenshot({
      path: `test-results/screenshots/${safeTitle}.png`,
      fullPage: true,
    });
  });

  test('logs in, opens CRM, creates activity and validates success', async ({ page }) => {
    const nowIso = new Date().toISOString();
    let activities = [
      {
        id: 'a-1',
        clientId: 'c-1',
        assignedToId: 'u1',
        type: 'SEGUIMIENTO',
        subject: 'Seguimiento inicial',
        description: 'Llamar cliente',
        dueDate: nowIso,
        status: 'PENDIENTE',
        createdAt: nowIso,
        client: { firstName: 'Ana', lastName: 'Pérez', clientType: 'NATURAL' },
      },
    ];

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

      if (pathname === '/api/clients') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{ id: 'c-1', firstName: 'Ana', lastName: 'Pérez', clientType: 'NATURAL' }],
            pagination: { page: 1, limit: 200, total: 1, totalPages: 1 },
          }),
        });
        return;
      }

      if (pathname === '/api/activities' && route.request().method() === 'POST') {
        const body = route.request().postDataJSON() as {
          clientId: string;
          type: string;
          subject: string;
          description?: string;
          scheduledFor?: string;
        };
        const created = {
          id: `a-${activities.length + 1}`,
          clientId: body.clientId,
          assignedToId: 'u1',
          type: body.type,
          subject: body.subject,
          description: body.description,
          dueDate: body.scheduledFor ?? nowIso,
          status: 'PENDIENTE',
          createdAt: nowIso,
          client: { firstName: 'Ana', lastName: 'Pérez', clientType: 'NATURAL' },
        };
        activities = [created, ...activities];
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: created }),
        });
        return;
      }

      if (pathname === '/api/activities') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: activities }),
        });
        return;
      }

      if (pathname.startsWith('/api/activities/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: {} }),
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
    const crmPage = new CRMPage(page);

    await loginPage.goto();
    await loginPage.login('admin@casavidal.com', 'admin123');

    await crmPage.openFromSidebar();
    await crmPage.openCreateModal();
    await crmPage.createActivity('Llamada de prueba E2E');
    await crmPage.assertCreated('Llamada de prueba E2E');
    expect(activities.length).toBeGreaterThan(1);
  });
});

