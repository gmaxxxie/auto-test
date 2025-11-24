# ACME Playwright 测试统一指引

## 运行时镜像

- 基于官方 `mcr.microsoft.com/playwright:v1.46.0-jammy`，统一发布到 `registry.internal.example.com/qa/playwright:1.46.0-2025.09`。
- 镜像内置 CJK 字体、Playwright 浏览器、`npm/pnpm` 与 CLI。
- 推送命令：

  ```bash
  cd docker/playwright
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -t registry.internal.example.com/qa/playwright:1.46.0-2025.09 \
    --push .
  ```

## NPM 预设包

- 包名：`@acme/playwright-preset@1.0.0`。
- 建议发布到内部私有 npm registry，供所有仓库复用。
- 包含内容：
  - `config`：统一 `defineConfig`，支持 BASE_URL、分片、代理、Playwright Service 汇报等。
  - `helpers`：`auth` 登录态、`mock` API stub；可按需扩展。
  - `acme-playwright` CLI：读取 `.env` 后执行 `npx playwright test`。

## 接入步骤

1. **安装依赖**
   ```bash
   npm install -D @playwright/test@1.46.0 @acme/playwright-preset@1.0.0
   ```
2. **配置文件**
   ```ts
   // playwright.config.ts
   import base from '@acme/playwright-preset/config';

   export default {
     ...base,
     testDir: './tests/e2e'
   };
   ```
3. **编写用例**：放入 `tests/e2e` 目录。
4. **运行测试**
   ```bash
   BASE_URL=https://staging.example.com npx playwright test
   # 或
   acme-playwright
   ```

## GitHub Actions 复用工作流

- 位置：`ci/.github/workflows/_reusable-playwright.yml`
- 在业务仓中引用：
  ```yaml
  name: E2E
  on: [push, pull_request]
  jobs:
    call-tests:
      uses: acme-inc/ci/.github/workflows/_reusable-playwright.yml@v1
      with:
        base_url: https://staging.example.com
        shard_total: 2
        browser_matrix: 'chromium,firefox'
      secrets:
        PLAYWRIGHT_API_TOKEN: ${{ secrets.PLAYWRIGHT_API_TOKEN }}
        INTERNAL_PROXY: ${{ secrets.INTERNAL_PROXY }}
  ```
- 需要在组织级别配置仓库 secrets：`PLAYWRIGHT_API_TOKEN`、`INTERNAL_PROXY`。

## 环境变量约定

| 变量 | 描述 |
| ---- | ---- |
| `BASE_URL` | 必填，被测服务根地址 |
| `HEADFUL` | `1` 为有头模式，默认无头 |
| `BROWSER_MATRIX` | 逗号分隔的浏览器/设备 ID |
| `SHARD_TOTAL` / `SHARD_INDEX` | 测试分片并行参数 |
| `PLAYWRIGHT_API_TOKEN` | Playwright Service API Token，用于云端报告 |
| `HTTP_PROXY` | 公司代理网关，自动注入 Playwright proxy |
| `EXTRA_HTTP_HEADERS` | JSON 字符串的额外请求头 |
| `PLAYWRIGHT_VIEWPORT` | JSON 定义 viewport，例如 `{"width":1280,"height":720}` |

## 常见扩展

- **统一登录**：在 `playwright-preset/src/helpers/auth.js` 中填充登录逻辑，并在业务仓的 `global-setup` 中调用。
- **Mock 能力**：使用 `applyRouteMocks` 或自定义加载器快速注入 API stub。
- **报告聚合**：CI 工作流默认产出 `html`、`junit`、`blob` 报告，可扩展上传步骤到内部报告站点。
- **版本治理**：建议由 QE 团队维护镜像和预设包的版本矩阵，例如 Node/Playwright/浏览器的兼容策略。

## FAQ

1. **CI 无法联网**：在仓库或组织 secrets 中配置 `INTERNAL_PROXY`，镜像会读取并设置 `HTTP_PROXY`。
2. **新增浏览器/设备**：在工作流输入 `browser_matrix` 中添加 Playwright `devices` 名称，如 `Pixel 7`。
3. **登录接口依赖多因子**：可自定义 `generateStorageState` 的 `tokenResolver`，在请求上下文中注入 token。
