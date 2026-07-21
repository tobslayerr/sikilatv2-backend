import multer from 'multer';
import { sendError } from '../utils/response.util';
import { Request, Response, NextFunction } from 'express';

const storage = multer.memoryStorage();
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Hanya file gambar (JPG/PNG/JPEG) yang diperbolehkan!'));
};

export const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Max 2MB
  fileFilter
});

export const handleUploadError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return sendError(res, 400, 'Ukuran foto terlalu besar! Maksimal 2MB.');
  } else if (err) {
    return sendError(res, 400, err.message);
  }
  next();
};