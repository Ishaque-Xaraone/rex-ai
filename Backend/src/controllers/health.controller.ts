import { Request, Response } from 'express';
import { checkDatabaseHealth } from '../database/connection.js';
import { config } from '../config/index.js';

export class HealthController {
  public static async getHealth(_req: Request, res: Response): Promise<void> {
    const dbHealth = await checkDatabaseHealth();

    const status = dbHealth.connected ? 'healthy' : 'degraded';
    const statusCode = dbHealth.connected ? 200 : 503;

    res.status(statusCode).json({
      status,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: config.env,
      services: {
        database: {
          connected: dbHealth.connected,
          latencyMs: dbHealth.latencyMs,
          error: dbHealth.error,
        },
        codeAnalyzer: {
          status: 'ready',
        },
      },
    });
  }
}
