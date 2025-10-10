# Repository Guidelines

## 项目结构与模块组织
- `docker/playwright/`：维护统一 Playwright 基础镜像，扩展系统依赖与 CJK 字体。
- `playwright-preset/`：发布到内部 registry 的 ESM 包，`src/` 为运行时配置，`types/` 提供 TS 声明，`bin/` 暴露 `acme-playwright` CLI。
- `example-project/`：示例业务仓，`tests/e2e/` 存放 `.spec.ts` 用例，`tests/global-setup.ts` 负责登录态，`scripts/` 含 Docker 运行脚本。
- `ci/.github/workflows/_reusable-playwright.yml`：复用型 GitHub Actions 工作流示例。
- `docs/`：包含测试接入与环境说明，提交前先对照更新流程文档。

## 构建、测试与开发命令
- 构建镜像：在 `docker/playwright` 执行\
  `docker buildx build --platform linux/amd64,linux/arm64 -t registry.internal.example.com/qa/playwright:1.46.0-2025.09 --push .`。
- 发布预设包：进入 `playwright-preset`，先 `npm install`，再运行\
  `npm publish --registry <internal>`。
- 示例项目测试：在 `example-project`\
  `npm install` → `npm run test:e2e`，或使用 `npm run test:e2e:ui` 开启有头模式。
- 容器内验证：`./scripts/run-in-docker.sh` 会挂载项目目录并复用统一镜像。

## 代码风格与命名约定
- JavaScript/TypeScript 默认使用 ES Module、2 空格缩进、结尾分号和单引号，保持与 `playwright-preset/src/*.js` 一致。
- Playwright 用例命名采用 `*.spec.ts`，`test.describe` 分组，断言通过 `expect`；共享逻辑放入 `playwright-preset/src/helpers/`。
- 配置与脚本文件沿用驼峰变量和大写环境变量名，例如 `BASE_URL`、`HEADFUL`。

## 测试规范
- 统一依赖 `@playwright/test@1.46.0`；用例集中在 `tests/e2e`，必要时在 `tests/__snapshots__` 保留快照。
- 优先复用 `acme-playwright` CLI，可在命令前设置 `BASE_URL`, `HEADFUL`, `SHARD_TOTAL` 等环境变量；CI 场景需在 Secrets 配置 `PLAYWRIGHT_API_TOKEN`、`INTERNAL_PROXY`。
- 登录态、Mock 等扩展能力请在 `playwright-preset/src/helpers` 衍生，减少重复实现。

## 提交与 Pull Request 指南
- 仓库尚未提供可查询的 Git 历史，推荐遵循 Conventional Commits：`feat:`、`fix:`、`chore:` 等祈使句短语，并在正文列出关键变更点。
- PR 描述需包含：变更动机、测试结果（可引用 `npm run test:e2e` 输出）、关联的工单或链接；若影响镜像或 preset 版本，请说明所需发布动作。
- 截图或日志仅在前端可视回归场景中附上，不必上传大型报告文件，改为链接 Playwright HTML 报告位置。

## 安全与配置提示
- 所有环境强制提供 `BASE_URL`；CI 环境若需代理，使用 `INTERNAL_PROXY` 注入 `HTTP_PROXY`。
- 机密凭证放入 Secrets 或 `.env`，避免提交到仓库；本地调试可通过 `.env.local` 配合 `dotenv` 自动加载。
