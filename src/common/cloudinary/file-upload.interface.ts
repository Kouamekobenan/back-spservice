export const FileUploaderName = 'FileUploader';
export interface FileUploader {
  upload(file: Express.Multer.File, type: 'image' | 'video'): Promise<string>;
  delete(publicId: string, type: 'image' | 'video'): Promise<void>;
}
