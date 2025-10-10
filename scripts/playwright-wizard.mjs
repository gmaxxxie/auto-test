#!/usr/bin/env node
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const rl = createInterface({ input: stdin, output: stdout });

rl.on('SIGINT', () => {
  stdout.write('\n操作已取消。\n');
  rl.close();
  process.exit(0);
});

const defaultValues = {
  imageTag: 'registry.internal.example.com/qa/playwright:1.46.0-2025.09',
  platforms: 'linux/amd64,linux/arm64',
  baseUrl: 'https://staging.example.com',
  registry: 'https://registry.internal.example.com'
};

async function ask(question, defaultValue) {
  const hint = defaultValue ? ` (${defaultValue})` : '';
  const answer = await rl.question(`${question}${hint}: `);
  if (!answer && defaultValue !== undefined) {
    return defaultValue;
  }
  return answer.trim();
}

async function askYesNo(question, defaultYes = true) {
  const suffix = defaultYes ? 'Y/n' : 'y/N';
  const raw = await rl.question(`${question} [${suffix}]: `);
  if (!raw) {
    return defaultYes;
  }
  const normalized = raw.trim().toLowerCase();
  return normalized === 'y' || normalized === 'yes';
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: false,
      ...options
    });
    child.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} 退出码 ${code}`));
      }
    });
    child.on('error', reject);
  });
}

const tasks = [
  {
    id: 'buildImage',
    title: '构建并推送 Playwright 镜像',
    async collect() {
      const imageTag = await ask('镜像标签', defaultValues.imageTag);
      const platforms = await ask('构建平台 (逗号分隔)', defaultValues.platforms);
      const push = await askYesNo('构建后立即推送镜像', true);
      return { imageTag, platforms, push };
    },
    async run(config) {
      const args = [
        'buildx',
        'build',
        '--platform',
        config.platforms,
        '-t',
        config.imageTag
      ];
      if (config.push) {
        args.push('--push');
      }
      args.push('.');
      await runCommand('docker', args, {
        cwd: path.join(repoRoot, 'docker', 'playwright')
      });
    }
  },
  {
    id: 'publishPreset',
    title: '发布 @acme/playwright-preset',
    async collect() {
      const registry = await ask('NPM Registry 地址', defaultValues.registry);
      const installDeps = await askYesNo('发布前执行 npm install', true);
      return { registry, installDeps };
    },
    async run(config) {
      const cwd = path.join(repoRoot, 'playwright-preset');
      if (config.installDeps) {
        await runCommand('npm', ['install'], { cwd });
      }
      await runCommand('npm', ['publish', '--registry', config.registry], {
        cwd
      });
    }
  },
  {
    id: 'runExampleTests',
    title: '运行示例项目测试',
    async collect() {
      const baseUrl = await ask('BASE_URL', defaultValues.baseUrl);
      const headful = await askYesNo('启用有头模式 (HEADFUL=1)', false);
      const uiMode = await askYesNo('使用 test:e2e:ui 命令', false);
      const installDeps = await askYesNo('执行 npm install', true);
      return { baseUrl, headful, uiMode, installDeps };
    },
    async run(config) {
      const cwd = path.join(repoRoot, 'example-project');
      if (config.installDeps) {
        await runCommand('npm', ['install'], { cwd });
      }
      const env = {
        ...process.env,
        BASE_URL: config.baseUrl
      };
      if (config.headful) {
        env.HEADFUL = '1';
      }
      const script = config.uiMode ? 'test:e2e:ui' : 'test:e2e';
      await runCommand('npm', ['run', script], { cwd, env });
    }
  },
  {
    id: 'runInDocker',
    title: '容器内验证示例项目',
    async collect() {
      const baseUrl = await ask('容器内使用的 BASE_URL', defaultValues.baseUrl);
      const ciMode = await askYesNo('以 CI=1 运行', false);
      return { baseUrl, ciMode };
    },
    async run(config) {
      const cwd = path.join(repoRoot, 'example-project');
      const env = {
        ...process.env,
        BASE_URL: config.baseUrl
      };
      if (config.ciMode) {
        env.CI = '1';
      }
      await runCommand(
        'bash',
        ['-lc', './scripts/run-in-docker.sh'],
        { cwd, env }
      );
    }
  }
];

async function selectTasks() {
  stdout.write('请选择要执行的任务，可输入数字或逗号分隔的多选，输入 all 运行全部。\n');
  tasks.forEach((task, index) => {
    stdout.write(`  ${index + 1}. ${task.title}\n`);
  });
  let selection;
  while (!selection) {
    const raw = await rl.question('输入选择 (默认 all): ');
    const answer = raw.trim();
    if (!answer) {
      selection = tasks.map((_, index) => index);
      break;
    }
    if (answer.toLowerCase() === 'all') {
      selection = tasks.map((_, index) => index);
      break;
    }
    const parts = answer.split(',').map(part => part.trim()).filter(Boolean);
    const indexes = [];
    let valid = true;
    for (const part of parts) {
      const number = Number(part);
      if (!Number.isInteger(number) || number < 1 || number > tasks.length) {
        valid = false;
        break;
      }
      indexes.push(number - 1);
    }
    if (valid && indexes.length > 0) {
      selection = Array.from(new Set(indexes));
    } else {
      stdout.write('输入无效，请重新输入，例如 1,3 或 all。\n');
    }
  }
  return selection.map(index => tasks[index]);
}

async function main() {
  stdout.write('\nACME Playwright 向导\n');
  stdout.write('该脚本会根据你的输入依次执行常见任务。\n\n');
  const chosenTasks = await selectTasks();
  const configs = [];
  for (const task of chosenTasks) {
    stdout.write(`\n[配置] ${task.title}\n`);
    const config = await task.collect();
    configs.push({ task, config });
  }
  stdout.write('\n即将执行以下任务：\n');
  configs.forEach(({ task }) => stdout.write(`- ${task.title}\n`));
  const proceed = await askYesNo('确认开始执行', true);
  if (!proceed) {
    stdout.write('操作已取消。\n');
    return;
  }
  for (const { task, config } of configs) {
    stdout.write(`\n[开始] ${task.title}\n`);
    try {
      await task.run(config);
      stdout.write(`[完成] ${task.title}\n`);
    } catch (error) {
      stdout.write(`[失败] ${task.title}: ${error.message}\n`);
      process.exitCode = 1;
      break;
    }
  }
}

main()
  .catch(error => {
    stdout.write(`执行失败: ${error.message}\n`);
    process.exit(1);
  })
  .finally(() => {
    rl.close();
  });
