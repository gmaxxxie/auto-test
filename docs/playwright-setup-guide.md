# Playwright 自动化测试操作说明

面向第一次接入的同学，按顺序完成以下步骤即可把本仓提供的 Playwright 基建应用到业务项目中。

## 1. 构建统一运行环境镜像
- 进入 `docker/playwright` 目录。
- 执行 README 中的 `docker buildx build` 命令，推送到公司的镜像仓库（默认 `registry.internal.example.com/qa/playwright:1.46.0-2025.09`）。
- 后续所有本地调试、CI 运行都应使用该镜像，避免环境不一致。

## 2. 发布 Playwright 预设包
- 进入 `playwright-preset` 目录。
- 运行 `npm publish --registry <你的内部 registry>` 发布 `@acme/playwright-preset@1.0.0`。
- 该包内含统一配置、CLI 入口以及登录/Mock 辅助函数。

## 3. 在业务仓安装依赖
- 在业务项目中运行：
  ```bash
  npm install -D @playwright/test@1.46.0 @acme/playwright-preset@1.0.0
  ```
- 如果有内部镜像源，记得配置 `.npmrc` 或使用 `npm config set registry`。

## 4. 配置 Playwright
- 在业务项目创建或更新 `playwright.config.ts`：
  ```ts
  import baseConfig from '@acme/playwright-preset/config';

  export default {
    ...baseConfig,
    testDir: './tests/e2e',
    globalSetup: './tests/global-setup.ts',
    use: {
      ...baseConfig.use,
      storageState:
        process.env.STORAGE_STATE_PATH ?? baseConfig.use?.storageState ?? '.playwright/auth/storage-state.json'
    }
  };
  ```
- 需要额外自定义（比如测试目录、全局设置）时可在该文件继续覆盖。

## 5. 准备环境变量
- 新建 `.env`（可复制 `example-project/.env.example`）。
- 至少设置 `BASE_URL=https://你的被测服务`。
- 常用可选变量：
  - `HEADFUL=1` 开启有头模式。
  - `BROWSER_MATRIX=chromium,firefox` 指定浏览器列表。
  - `HTTP_PROXY`、`HTTPS_PROXY` 注入公司代理。
  - `SHARD_TOTAL`、`SHARD_INDEX` 控制分片并行。

## 6. 编写测试与辅助脚本
- 在 `tests/e2e` 下新增 Playwright 用例，示例：
  ```ts
  import { test, expect } from '@playwright/test';

  test('首页可访问', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/example/i);
  });
  ```
- 若需要预先登录，参考 `tests/global-setup.ts` 使用 `generateStorageState`（位于 `@acme/playwright-preset/helpers/auth`）。
- 若需要接口 Mock，调用 `applyRouteMocks` 或 `loadMocksFromFile`（位于 `@acme/playwright-preset/helpers/mock`）。

## 7. 本地运行测试
- 直接执行 `npx acme-playwright`，CLI 会自动读取 `.env*` 文件并校验 `BASE_URL`。
- 想在容器中运行，可参考 `example-project/scripts/run-in-docker.sh`，使用统一镜像确保一致环境。

## 8. 接入 GitHub Actions
- 在业务仓工作流中引用 `ci/.github/workflows/_reusable-playwright.yml`：
  ```yaml
  jobs:
    e2e:
      uses: acme-inc/ci/.github/workflows/_reusable-playwright.yml@v1
      with:
        base_url: https://staging.example.com
        browser_matrix: chromium,firefox
        shard_total: 2
      secrets:
        PLAYWRIGHT_API_TOKEN: 
        INTERNAL_PROXY: 
  ```
- 在仓库或组织级 secrets 填写 `PLAYWRIGHT_API_TOKEN`、`INTERNAL_PROXY`。
- 推送代码后，工作流会使用统一镜像运行测试，并在失败时保留 HTML/JUnit/Trace 报告。

## 常见问题提示
- 未设置 `BASE_URL`：CLI 会直接退出，请检查 `.env`。
- 登录态失败：确认 `E2E_USERNAME`、`E2E_PASSWORD` 等环境变量是否存在。
- CI 无法联网：确保 `INTERNAL_PROXY` 已配置并在工作流 inputs 中设置 `no_proxy` 白名单。

完成以上步骤后，新的业务仓即可重复利用这套基建快速搭建端到端自动化测试流程。
