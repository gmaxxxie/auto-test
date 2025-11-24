#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';

const cwd = process.cwd();
const envFiles = [
  '.env.playwright.local',
  '.env.playwright',
  '.env.local',
  '.env'
];

for (const file of envFiles) {
  const absolute = path.resolve(cwd, file);
  if (existsSync(absolute)) {
    dotenv.config({ path: absolute, override: false });
  }
}

if (!process.env.BASE_URL) {
  console.error('[acme-playwright-preset] BASE_URL 未设置，无法运行测试。');
  process.exit(1);
}

const args = process.argv.slice(2);
const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const child = spawn(command, ['playwright', 'test', ...args], {
  stdio: 'inherit',
  env: process.env
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
