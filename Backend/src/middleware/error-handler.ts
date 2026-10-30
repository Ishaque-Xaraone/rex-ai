import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { SecurityError } from '../utils/security.js';

export interface StructuredApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request payload validation failed',
        details: err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
    });
    return;
  }

  // 2. Security Violations (Path traversal, Zip slip, limits)
  if (err instanceof SecurityError) {
    res.status(403).json({
      success: false,
      error: {
        code: 'SECURITY_VIOLATION',
        message: err.message,
      },
    });
    return;
  }

  // 3. Not Found or Custom Errors
  if (err instanceof Error) {
    if (err.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: err.message,
        },
      });
      return;
    }

    // Generic Internal Error
    console.error('[Unhandled Error]', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected internal error occurred',
      },
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error occurred',
    },
  });
}
