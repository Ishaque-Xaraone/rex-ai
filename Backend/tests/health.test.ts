import { describe, it, expect } from 'vitest';
import { Request, Response } from 'express';
import { HealthController } from '../src/controllers/health.controller.js';

describe('HealthController', () => {
  it('returns structured health response', async () => {
    let statusCode = 200;
    let responseBody: Record<string, unknown> | null = null;

    const req = {} as Request;
    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(body: Record<string, unknown>) {
        responseBody = body;
        return this;
      },
    } as unknown as Response;

    await HealthController.getHealth(req, res);

    expect([200, 503]).toContain(statusCode);
    expect(responseBody).not.toBeNull();
    expect(responseBody).toHaveProperty('status');
    expect(responseBody).toHaveProperty('timestamp');
    expect(responseBody).toHaveProperty('services');

    const services = (responseBody as { services: { codeAnalyzer: { status: string } } }).services;
    expect(services.codeAnalyzer.status).toBe('ready');
  });
});
