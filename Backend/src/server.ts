import { app } from './app.js';
import { config } from './config/index.js';
import { checkDatabaseHealth, closePool } from './database/connection.js';

const server = app.listen(config.port, async () => {
  console.log(`[REX AI Backend] Server running on http://localhost:${config.port}`);
  console.log(`[REX AI Backend] Environment: ${config.env}`);

  const dbHealth = await checkDatabaseHealth();
  if (dbHealth.connected) {
    console.log(`[REX AI Backend] PostgreSQL connected successfully (latency: ${dbHealth.latencyMs}ms)`);
  } else {
    console.warn(`[REX AI Backend] PostgreSQL connection warning: ${dbHealth.error}`);
    console.warn('[REX AI Backend] Running with in-memory storage fallback. Start PostgreSQL to persist analysis data.');
  }
});

async function handleShutdown(signal: string) {
  console.log(`\n[REX AI Backend] Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('[REX AI Backend] HTTP server closed.');
    await closePool();
    console.log('[REX AI Backend] Database connections closed.');
    process.exit(0);
  });
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
