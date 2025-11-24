import { promises as fs } from 'node:fs';
import path from 'node:path';
import { request } from '@playwright/test';
import { z } from 'zod';

const authOptionsSchema = z.object({
  baseURL: z.string().url().optional(),
  storagePath: z.string().default('.playwright/auth/storage-state.json'),
  credentials: z
    .object({
      username: z.string(),
      password: z.string(),
      loginPath: z.string().default('/api/auth/login'),
      payload: z.record(z.any()).optional()
    })
    .optional(),
  tokenResolver: z
    .function()
    .args(z.object({ baseURL: z.string().url(), context: z.any() }))
    .returns(z.promise(z.any()))
    .optional()
});

/**
 * 生成并写入 Playwright storageState，供 globalSetup 复用。
 */
export async function generateStorageState(options = {}) {
  const parsed = authOptionsSchema.parse(options);
  const baseURL = parsed.baseURL ?? process.env.AUTH_BASE_URL ?? process.env.BASE_URL;

  if (!baseURL) {
    throw new Error('[acme-playwright-preset] generateStorageState 需要 baseURL。');
  }

  const storagePath = parsed.storagePath;
  const targetDir = path.dirname(storagePath);
  await fs.mkdir(targetDir, { recursive: true });

  const context = await request.newContext({ baseURL });

  try {
    if (parsed.credentials) {
      const { username, password, loginPath, payload } = parsed.credentials;
      const response = await context.post(loginPath, {
        data: {
          username,
          password,
          ...(payload ?? {})
        }
      });

      if (!response.ok()) {
        throw new Error(`登录接口 ${loginPath} 返回 ${response.status()} ${response.statusText()}`);
      }
    }

    if (parsed.tokenResolver) {
      await parsed.tokenResolver({ baseURL, context });
    }

    const state = await context.storageState();
    await fs.writeFile(storagePath, JSON.stringify(state, null, 2), 'utf-8');
    return storagePath;
  } finally {
    await context.dispose();
  }
}

/**
 * 返回一个可在 globalSetup 中直接调用的 helper。
 */
export function createGlobalSetup(options) {
  return async () => {
    const storagePath = await generateStorageState(options);
    process.env.STORAGE_STATE_PATH = storagePath;
  };
}
