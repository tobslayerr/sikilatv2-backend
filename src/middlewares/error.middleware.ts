import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.util';
import { ENV } from '../config/env';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Tampilkan detail error di terminal hanya jika mode Development
  if (ENV.NODE_ENV === 'development') {
    console.error(`[🔥 ERROR] ${req.method} ${req.url} >>`, err.message);
  }

  sendError(res, statusCode, message, ENV.NODE_ENV === 'development' ? err.stack : null);
};