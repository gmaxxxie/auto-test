import type { APIRequestContext } from '@playwright/test';

export interface AuthCredentials {
  username: string;
  password: string;
  loginPath?: string;
  payload?: Record<string, unknown>;
}

export interface GenerateStorageStateOptions {
  baseURL?: string;
  storagePath?: string;
  credentials?: AuthCredentials;
  tokenResolver?: (context: { baseURL: string; context: APIRequestContext }) => Promise<unknown>;
}

export declare function generateStorageState(options?: GenerateStorageStateOptions): Promise<string>;
export declare function createGlobalSetup(options?: GenerateStorageStateOptions): () => Promise<void>;
