import type { Page } from '@playwright/test';

export interface RouteMock {
  url: string;
  method?: string;
  status?: number;
  delay?: number;
  headers?: Record<string, string>;
  body?: unknown;
}

export declare function applyRouteMocks(page: Page, mocks?: RouteMock[]): Promise<void>;
export declare function loadMocksFromFile(page: Page, filePath: string): Promise<void>;
