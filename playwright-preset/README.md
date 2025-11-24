# @acme/playwright-preset

ACME 团队的 Playwright 测试预设，统一封装运行参数、常用 helper 与 CLI。发布到内部私有 NPM 后，各业务仓可通过以下方式接入：

```bash
npm install -D @playwright/test@1.46.0 @acme/playwright-preset@1.0.0
```

在 `playwright.config.ts` 中复用预设：

```ts
import baseConfig from '@acme/playwright-preset/config';

export default {
  ...baseConfig,
  testDir: './tests/e2e'
};
```

或按需扩展 helper：

```ts
import { setupAuthStorage } from '@acme/playwright-preset/helpers/auth';
```

通过 CLI 启动测试：

```bash
BASE_URL=https://staging.example.com acme-playwright
```

> 发布前请在包内执行 `npm publish --registry <内部 registry>`，并保证 `@playwright/test@1.46.0` 作为 peer 依赖存在于业务仓中。
