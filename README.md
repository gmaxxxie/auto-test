# ACME Playwright 测试环境 MVP

该仓库提供在 ACME 内部快速落地 Playwright 端到端测试的最小可行版本，包含统一镜像、NPM 预设包、GitHub Actions 工作流与示例项目。

## 目录

- `docker/playwright/`：构建统一运行时镜像，推送到 `registry.internal.example.com/qa/playwright:1.46.0-2025.09`。
- `playwright-preset/`：`@acme/playwright-preset@1.0.0` 包源码，封装配置、helpers 与 CLI。
- `ci/.github/workflows/_reusable-playwright.yml`：可复用的 GitHub Actions 工作流。
- `example-project/`：示例仓库，演示本地、Docker、Compose 使用方式。
- `docs/testing.md`：统一文档与操作指南。

## 快速上手

### 交互式向导

```bash
node scripts/playwright-wizard.mjs
```

按照交互提示填写镜像标签、Registry、BASE_URL 等信息，可一键完成镜像构建、预设发布与示例项目测试。

### 手动执行

1. 构建并推送镜像：`docker buildx build --platform linux/amd64,linux/arm64 -t registry.internal.example.com/qa/playwright:1.46.0-2025.09 --push docker/playwright`。
2. 发布预设包：在 `playwright-preset` 内执行 `npm publish --registry <internal>`。
3. 业务仓引入：`npm install -D @playwright/test@1.46.0 @acme/playwright-preset@1.0.0` 并复用 `config`。
4. 引用 CI 模板：`uses: acme-inc/ci/.github/workflows/_reusable-playwright.yml@v1`。

更多细节见 `docs/testing.md`。
