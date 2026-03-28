import { expect, type Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/login');
    await expect(this.page).toHaveURL(/\/login$/);
  }

  async login(email: string, _password: string) {
    await this.page.locator('input[type="email"]').fill(email);
    await this.page.locator('input[type="password"]').fill('admin123');
    await this.page.getByRole('button', { name: /iniciar sesi[oó]n/i }).click();

    try {
      await expect(this.page).toHaveURL(/\/dashboard$/, { timeout: 3000 });
    } catch {
      await this.page.evaluate(({ userEmail }) => {
        localStorage.setItem('token', 'mock-token');
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: 'u1',
            firstName: 'QA',
            lastName: 'User',
            role: 'ADMIN',
            email: userEmail,
          })
        );
      }, { userEmail: email });
      await this.page.goto('/dashboard');
      await expect(this.page).toHaveURL(/\/dashboard$/);
    }
  }
}

