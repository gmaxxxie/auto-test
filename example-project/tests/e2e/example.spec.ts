import { test, expect } from '@playwright/test';

test.describe('示例健康检查', () => {
  test('首页可访问', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/example/i);
  });

  test('API 状态码正常', async ({ request }) => {
    const response = await request.get('/healthz');
    expect(response.ok()).toBeTruthy();
  });
});
