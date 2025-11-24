# syntax=docker/dockerfile:1.7
FROM mcr.microsoft.com/playwright:v1.46.0-jammy

# 安装 CJK 字体与基本本地化支持，保证截图与 PDF 输出一致
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        fonts-noto-cjk \
        fonts-noto-color-emoji \
        fonts-noto-cjk-extra \
        locales \
    && locale-gen zh_CN.UTF-8 en_US.UTF-8 \
    && rm -rf /var/lib/apt/lists/*

ENV LANG=zh_CN.UTF-8 \
    LC_ALL=zh_CN.UTF-8 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# 预创建 Playwright 缓存目录，避免 CI 并发写权限问题
RUN mkdir -p /ms-playwright /workspace \
    && chown -R pwuser:pwuser /ms-playwright /workspace

# 预安装项目常用的 NPM 工具（可按需扩展）
RUN npm install -g npm@10.8.1 pnpm@9.5.0 playwright-cli@1.46.0

USER pwuser

WORKDIR /workspace

CMD ["npx", "playwright", "test"]
