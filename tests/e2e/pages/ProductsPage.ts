import { expect, type Page } from '@playwright/test';

export class ProductsPage {
  constructor(private readonly page: Page) {}

  async openFromSidebar() {
    await this.page.getByRole('link', { name: /productos/i }).click();
    await expect(this.page).toHaveURL(/\/products$/);
    await expect(this.page.getByRole('heading', { name: 'Productos' })).toBeVisible();
  }

  async clickNewProduct() {
    await this.page.getByRole('button', { name: /nuevo producto/i }).click();
    await expect(this.page.getByRole('heading', { name: /nuevo producto/i })).toBeVisible();
  }

  async createProduct() {
    const categoryId = '11111111-1111-1111-1111-111111111111';
    await this.page.locator('input[name="name"]').fill('Producto E2E QA');
    await this.page.locator('input[name="sku"]').fill('E2E-SKU-001');
    await this.page.locator('select[name="categoryId"]').selectOption(categoryId);
    await this.page.locator('input[name="costPrice"]').fill('10');
    await this.page.locator('input[name="salePrice"]').fill('15');
    await this.page.locator('input[name="currentStock"]').fill('5');
    await this.page.getByRole('button', { name: /crear producto/i }).click();
    await this.page.locator('form').press('Enter');
  }

}

