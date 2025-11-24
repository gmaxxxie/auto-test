# Playwright 示例项目

该示例演示如何在业务仓中接入 `@acme/playwright-preset` 与统一镜像。

## 快速开始

```bash
cd example-project
cp .env.example .env
npm install
BASE_URL=https://staging.example.com npm run test:e2e
```

## 使用统一 CLI

- `npm run test:e2e`：在本机无头执行。
- `npm run test:e2e:ui`：有头模式，便于调试。
- `npm run test:e2e:docker`：调用公司镜像运行，默认读取 `.env`。

## Docker Compose

```bash
cd example-project
docker compose up --abort-on-container-exit
```

## 自定义

- 登录态：在 `.env` 中设置 `E2E_USERNAME`、`E2E_PASSWORD`，`tests/global-setup.ts` 会生成 storageState。
- 代理：设置 `HTTP_PROXY` 后，预设会自动注入 Playwright `proxy` 配置。
- 浏览器矩阵：修改 `BROWSER_MATRIX`，例如 `chromium,firefox,webkit`。
