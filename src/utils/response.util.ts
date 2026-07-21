import { Response } from 'express';

export const sendSuccess = (res: Response, statusCode: number, message: string, data: any = null) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
};

export const sendError = (res: Response, statusCode: number, message: string, errors: any = null) => {
  return res.status(statusCode).json({
    status: 'error',
    message,
    errors,
  });
};

export const sendPaginatedSuccess = (res: Response, statusCode: number, message: string, data: any[], meta: { total: number, page: number, limit: number, totalPages: number }) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
    meta
  });
};