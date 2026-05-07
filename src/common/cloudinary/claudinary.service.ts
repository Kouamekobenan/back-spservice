import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { FileUploader } from './file-upload.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CloudinaryService implements FileUploader {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * Upload a file to Cloudinary
   * @param file - The file to upload
   * @param type - 'image' or 'video' (default: 'image')
   * @returns URL of the uploaded media
   */
  async upload(
    file: Express.Multer.File,
    type: 'image' | 'video' = 'image',
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: type,
            folder: type === 'video' ? 'videos' : 'images',
          },
          (error, result?: UploadApiResponse) => {
            if (error || !result) {
              return reject(error || new Error('Upload failed'));
            }
            resolve(result.secure_url);
          },
        )
        .end(file.buffer);
    });
  }

  /**
   * Delete a media file from Cloudinary
   * @param publicId - The public ID of the file (e.g. from URL)
   * @param type - 'image' or 'video' (default: 'image')
   */
  async delete(
    publicId: string,
    type: 'image' | 'video' = 'image',
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        { resource_type: type },
        (error, result) => {
          if (error) return reject(error);
          if (result.result !== 'ok' && result.result !== 'not found') {
            return reject(
              new Error(`Failed to delete ${type}: ${result.result}`),
            );
          }
          resolve();
        },
      );
    });
  }
}