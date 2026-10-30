import express, { Express } from 'express';
import morgan from 'morgan';
import apiRouter from './routes/index.js';
import { configureSecurityMiddleware } from './middleware/security.js';
import { errorHandler } from './middleware/error-handler.js';
import { config } from './config/index.js';

export function createApp(): Express {
  const app = express();

  // Security headers & CORS
  configureSecurityMiddleware().forEach((mw) => app.use(mw));

  // Request logging
  if (config.env !== 'test') {
    app.use(morgan('dev'));
  }

  // Body parsing with limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Root health probe
  app.get('/', (_req, res) => {
    res.json({
      name: 'REX AI Platform API',
      version: '0.1.0',
      status: 'online',
      docs: '/api/health',
    });
  });

  // Mount API router
  app.use('/api', apiRouter);

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}

export const app = createApp();
