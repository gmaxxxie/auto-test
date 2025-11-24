import { defineConfig, devices } from '@playwright/test';

const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const baseURL = process.env.BASE_URL;

if (!baseURL) {
  throw new Error('[acme-playwright-preset] 必须提供 BASE_URL 环境变量。');
}

const headless = process.env.HEADFUL === '1' ? false : true;
const shardTotal = Number.parseInt(process.env.SHARD_TOTAL ?? '1', 10);
const shardIndex = Number.parseInt(process.env.SHARD_INDEX ?? '1', 10);
const defaultBrowsers = (process.env.BROWSER_MATRIX ?? 'chromium').split(',').map((entry) => entry.trim()).filter(Boolean);

const buildProjects = () => {
  if (defaultBrowsers.length === 0) {
    return [
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] }
      }
    ];
  }

  return defaultBrowsers.map((browser) => {
    if (browser === 'chromium') {
      return {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] }
      };
    }

    if (browser === 'firefox') {
      return {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] }
      };
    }

    if (browser === 'webkit') {
      return {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] }
      };
    }

    if (devices[browser]) {
      return {
        name: browser,
        use: { ...devices[browser] }
      };
    }

    console.warn('[acme-playwright-preset] 未识别的浏览器 "%s"，使用 Playwright 默认配置。', browser);

    return {
      name: browser,
      use: {}
    };
  });
};

const httpProxy = process.env.HTTP_PROXY ? { server: process.env.HTTP_PROXY } : undefined;

const parseExtraHTTPHeaders = () => {
  const raw = process.env.EXTRA_HTTP_HEADERS;
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : undefined;
  } catch (error) {
    console.warn('[acme-playwright-preset] EXTRA_HTTP_HEADERS 解析失败，使用 JSON 字符串，例如 {"X-Test": "1"}。', error);
    return undefined;
  }
};

const safeViewport = () => {
  if (!process.env.PLAYWRIGHT_VIEWPORT) {
    return { width: 1280, height: 720 };
  }

  try {
    const parsed = JSON.parse(process.env.PLAYWRIGHT_VIEWPORT);
    if (parsed && typeof parsed === 'object' && Number.isInteger(parsed.width) && Number.isInteger(parsed.height)) {
      return parsed;
    }
  } catch (error) {
    console.warn('[acme-playwright-preset] PLAYWRIGHT_VIEWPORT 解析失败，使用默认 1280x720。', error);
  }

  return { width: 1280, height: 720 };
};

const config = defineConfig({
  testDir: process.env.TEST_DIR ?? './tests/e2e',
  snapshotDir: process.env.SNAPSHOT_DIR ?? './tests/__snapshots__',
  outputDir: process.env.OUTPUT_DIR ?? './playwright-report/artifacts',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: Number.parseInt(process.env.PLAYWRIGHT_RETRIES ?? (isCI ? '2' : '0'), 10),
  workers: process.env.PLAYWRIGHT_WORKERS ?? (isCI ? '50%' : undefined),
  timeout: Number.parseInt(process.env.PLAYWRIGHT_TIMEOUT ?? '60000', 10),
  expect: {
    timeout: Number.parseInt(process.env.PLAYWRIGHT_EXPECT_TIMEOUT ?? '10000', 10)
  },
  reporter: [
    process.env.CI ? ['github'] : ['list'],
    [
      'html',
      {
        outputFolder: process.env.HTML_REPORT_DIR ?? 'playwright-report/html',
        open: 'never'
      }
    ],
    [
      'junit',
      {
        outputFile: process.env.JUNIT_REPORT_PATH ?? 'playwright-report/junit/results.xml'
      }
    ],
    process.env.PLAYWRIGHT_API_TOKEN
      ? [
          'playwright',
          {
            project: process.env.PLAYWRIGHT_PROJECT ?? 'acme-inc/e2e',
            apiKey: process.env.PLAYWRIGHT_API_TOKEN
          }
        ]
      : null,
    process.env.PLAYWRIGHT_ENABLE_BLOB === '1'
      ? [
          'blob',
          {
            outputDir: process.env.BLOB_REPORT_DIR ?? 'playwright-report/blob'
          }
        ]
      : null
  ].filter(Boolean),
  metadata: {
    environment: process.env.PLAYWRIGHT_ENV ?? (isCI ? 'ci' : 'local'),
    commit: process.env.GITHUB_SHA,
    build: process.env.GITHUB_RUN_ID
  },
  projects: buildProjects(),
  use: {
    baseURL,
    headless,
    trace: isCI ? 'retain-on-failure' : 'on',
    screenshot: 'only-on-failure',
    video: isCI ? 'retain-on-failure' : 'off',
    actionTimeout: Number.parseInt(process.env.ACTION_TIMEOUT ?? '15000', 10),
    navigationTimeout: Number.parseInt(process.env.NAVIGATION_TIMEOUT ?? '30000', 10),
    ignoreHTTPSErrors: process.env.IGNORE_HTTPS_ERRORS === '1',
    proxy: httpProxy,
    extraHTTPHeaders: parseExtraHTTPHeaders(),
    storageState: process.env.STORAGE_STATE_PATH,
    viewport: safeViewport()
  },
  ...(shardTotal > 1
    ? {
        shard: {
          total: shardTotal,
          current: Math.min(Math.max(shardIndex, 1), shardTotal)
        }
      }
    : {})
});

export default config;
