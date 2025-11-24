import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

const mockSchema = z.array(
  z.object({
    url: z.string(),
    method: z.string().optional(),
    status: z.number().default(200),
    delay: z.number().optional(),
    headers: z.record(z.string()).optional(),
    body: z.any().optional()
  })
);

export async function applyRouteMocks(page, mocks = []) {
  const definitions = mockSchema.optional().parse(mocks) ?? [];

  await Promise.all(
    definitions.map(async (mock) => {
      await page.route(mock.url, async (route, request) => {
        if (mock.method && request.method().toUpperCase() !== mock.method.toUpperCase()) {
          await route.continue();
          return;
        }

        if (mock.delay) {
          await new Promise((resolve) => setTimeout(resolve, mock.delay));
        }

        await route.fulfill({
          status: mock.status,
          headers: mock.headers,
          body: mock.body !== undefined ? JSON.stringify(mock.body) : undefined
        });
      });
    })
  );
}

export async function loadMocksFromFile(page, filePath) {
  const absolute = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  const content = await fs.readFile(absolute, 'utf-8');
  const parsed = JSON.parse(content);
  await applyRouteMocks(page, parsed);
}
