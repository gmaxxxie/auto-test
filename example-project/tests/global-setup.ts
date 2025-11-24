import { generateStorageState } from '@acme/playwright-preset/helpers/auth';

export default async function globalSetup() {
  if (!process.env.E2E_USERNAME || !process.env.E2E_PASSWORD) {
    console.warn('[example] 缺少 E2E_USERNAME/E2E_PASSWORD，跳过登录态初始化。');
    return;
  }

  const storagePath = await generateStorageState({
    storagePath: '.playwright/auth/storage-state.json',
    credentials: {
      username: process.env.E2E_USERNAME,
      password: process.env.E2E_PASSWORD,
      loginPath: process.env.E2E_LOGIN_PATH ?? '/api/auth/login'
    }
  });

  process.env.STORAGE_STATE_PATH = storagePath;
}
