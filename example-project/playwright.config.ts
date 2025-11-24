import baseConfig from '@acme/playwright-preset/config';

const config = {
  ...baseConfig,
  testDir: './tests/e2e',
  globalSetup: './tests/global-setup.ts',
  use: {
    ...baseConfig.use,
    storageState:
      process.env.STORAGE_STATE_PATH ?? baseConfig.use?.storageState ?? '.playwright/auth/storage-state.json'
  }
};

export default config;
