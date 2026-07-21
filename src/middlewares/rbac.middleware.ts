import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.util';

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user || !allowedRoles.includes(user.role)) {
      return sendError(res, 403, `Forbidden: Akses ditolak. Halaman ini butuh role: ${allowedRoles.join(', ')}`);
    }
    
    next();
  };
};