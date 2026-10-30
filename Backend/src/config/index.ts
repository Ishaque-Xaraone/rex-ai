import dotenv from 'dotenv';
import path from 'node:path';
import { SECURITY_LIMITS } from '@rex/shared';

dotenv.config();

export interface AppConfig {
  env: 'development' | 'production' | 'test';
  port: number;
  corsOrigin: string;
  storageDir: string;
  database: {
    url?: string;
    host: string;
    port: number;
    user: string;
    password?: string;
    database: string;
    ssl: boolean;
    maxConnections: number;
  };
  aiService: {
    baseUrl: string;
    timeoutMs: number;
  };
  security: {
    maxUploadSizeBytes: number;
    maxExpandedSizeBytes: number;
    maxFileCount: number;
  };
}

const env = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';

export const config: AppConfig = {
  env,
  port: parseInt(process.env.PORT || '4000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  storageDir: process.env.STORAGE_DIR
    ? path.resolve(process.env.STORAGE_DIR)
    : path.resolve(process.cwd(), 'storage'),
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'rex_ai',
    ssl: process.env.DB_SSL === 'true',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
  },
  aiService: {
    baseUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    timeoutMs: parseInt(process.env.AI_SERVICE_TIMEOUT_MS || '30000', 10),
  },
  security: {
    maxUploadSizeBytes: parseInt(
      process.env.MAX_UPLOAD_SIZE_BYTES || String(SECURITY_LIMITS.MAX_UPLOAD_SIZE_BYTES),
      10
    ),
    maxExpandedSizeBytes: parseInt(
      process.env.MAX_EXPANDED_SIZE_BYTES || String(SECURITY_LIMITS.MAX_EXPANDED_ARCHIVE_BYTES),
      10
    ),
    maxFileCount: parseInt(
      process.env.MAX_FILE_COUNT || String(SECURITY_LIMITS.MAX_FILE_COUNT),
      10
    ),
  },
};
