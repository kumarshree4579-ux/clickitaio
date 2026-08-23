import { v2 as cloudinary } from 'cloudinary';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const streamifier = require('streamifier') as { createReadStream: (buf: Buffer) => NodeJS.ReadableStream };

function configureCloudinary() {
  const url = process.env.CLOUDINARY_URL;
  if (url) {
    const match = url.match(/cloudinary:\/\/(\w+):([^@]+)@(.+)/);
    if (match) {
      cloudinary.config({ api_key: match[1], api_secret: match[2], cloud_name: match[3] });
      return;
    }
  }
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
}

export async function uploadBufferToCloudinary(buffer: Buffer, folder?: string) {
  configureCloudinary();
  return new Promise<{ url: string; public_id: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) return reject(error);
      if (!result) return reject(new Error('No result from cloudinary'));
      resolve({ url: result.secure_url, public_id: result.public_id });
    });
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  configureCloudinary();
  await cloudinary.uploader.destroy(publicId);
}
