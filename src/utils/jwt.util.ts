import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN as any,
  });
};

export const verifyToken = (token: string): any | null => {
  try {
    return jwt.verify(token, ENV.JWT_SECRET);
  } catch (error) {
    return null; // Jika token invalid/expired, kembalikan null tanpa membuat server mati
  }
};