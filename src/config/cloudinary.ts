import { v2 as cloudinary } from 'cloudinary';
import { ENV } from './env';
import { Readable } from 'stream';

if (ENV.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
    api_key: ENV.CLOUDINARY_API_KEY,
    api_secret: ENV.CLOUDINARY_API_SECRET,
  });
}

export const uploadImage = async (buffer: Buffer, folder: string): Promise<string> => {
  if (!ENV.CLOUDINARY_CLOUD_NAME) return 'https://dummyimage.com/600x400/000/fff&text=No+Cloudinary+Setup';
  
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) return reject(error);
      resolve(result?.secure_url || '');
    });
    Readable.from(buffer).pipe(uploadStream);
  });
};