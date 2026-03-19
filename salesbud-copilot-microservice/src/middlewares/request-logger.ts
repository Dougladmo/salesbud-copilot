import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  logger.info({ method: req.method, url: req.url }, 'incoming request');
  next();
}
