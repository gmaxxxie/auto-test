#!/usr/bin/env bash
set -euo pipefail

IMAGE="registry.internal.example.com/qa/playwright:1.46.0-2025.09"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ ! -f "${PROJECT_ROOT}/package.json" ]]; then
  echo "[example] 未找到 package.json，请在 example-project 目录内执行。" >&2
  exit 1
fi

if [[ ! -f "${PROJECT_ROOT}/.env" ]]; then
  if [[ -f "${PROJECT_ROOT}/.env.example" ]]; then
    cp "${PROJECT_ROOT}/.env.example" "${PROJECT_ROOT}/.env"
    echo "[example] 已根据 .env.example 生成默认 .env，请按需修改。"
  else
    touch "${PROJECT_ROOT}/.env"
  fi
fi

DOCKER_CMD=(
  docker run --rm -it
  --env-file "${PROJECT_ROOT}/.env"
  -e CI=${CI:-0}
  -v "${PROJECT_ROOT}:/workspace"
  -w /workspace
  "${IMAGE}"
  bash -lc "npm install && BASE_URL=\"${BASE_URL:-https://staging.example.com}\" npx playwright test"
)

"${DOCKER_CMD[@]}"
