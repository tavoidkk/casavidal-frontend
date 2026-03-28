import { expect, type Page } from '@playwright/test';

export class CRMPage {
  constructor(private readonly page: Page) {}

  async openFromSidebar() {
    await this.page.getByRole('link', { name: /crm/i }).click();
    await expect(this.page).toHaveURL(/\/crm$/);
    await expect(this.page.getByRole('heading', { name: 'CRM' })).toBeVisible();
  }

  async openCreateModal() {
    await this.page.getByRole('button', { name: /nueva actividad/i }).click();
    await expect(this.page.getByRole('heading', { name: /nueva actividad crm/i })).toBeVisible();
  }

  async createActivity(title: string) {
    await this.page.locator('label:has-text("Cliente *") + select').selectOption('c-1');
    await this.page.locator('label:has-text("Tipo *") + select').selectOption('LLAMADA');
    await this.page.locator('label:has-text("Asunto *") + input').fill(title);
    await this.page.getByRole('button', { name: /crear actividad/i }).click();
  }

  async assertCreated(title: string) {
    await expect(this.page.getByText('Actividad creada.')).toBeVisible();
    await expect(this.page.getByRole('cell', { name: title })).toBeVisible();
  }
}

