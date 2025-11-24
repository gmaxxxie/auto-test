#!/usr/bin/env node
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

try {
  const pkg = require('@playwright/test/package.json');
  if (!pkg?.version?.startsWith('1.46.0')) {
    console.warn('\n[acme-playwright-preset] 警告：检测到 @playwright/test 版本为 %s，建议使用 1.46.0 以保证兼容。\n', pkg?.version ?? '未知');
  }
} catch (error) {
  console.warn('\n[acme-playwright-preset] 提示：未能读取 @playwright/test，安装后请确保在项目中声明依赖。\n');
  if (process.env.DEBUG) {
    console.warn(error);
  }
}
