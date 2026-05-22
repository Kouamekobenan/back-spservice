import { Injectable, Logger } from '@nestjs/common';
import { FileUploader } from '../cloudinary/file-upload.interface';
import * as fs from 'fs';
import * as path from 'path';

/**
 * LocalFileService — Mode Offline
 * Stockage de fichiers local dans le dossier ./uploads/
 * Utilisé automatiquement quand DATABASE_PROVIDER=sqlite
 *
 * En production cloud → CloudinaryService prend le relais
 * En mode offline → Les fichiers sont stockés localement
 */
@Injectable()
export class LocalFileService implements FileUploader {
  private readonly logger = new Logger(LocalFileService.name);

  // Dossier de stockage (à la racine du projet backend)
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    // Créer le dossier uploads/ si il n'existe pas
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`📁 Dossier uploads créé: ${this.uploadDir}`);
    }
  }

  /**
   * Stocke un fichier localement et retourne une URL relative
   * @returns URL locale ex: /uploads/1716500000000-photo.jpg
   */
  async upload(
    file: Express.Multer.File,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _type: 'image' | 'video' = 'image',
  ): Promise<string> {
    const timestamp = Date.now();
    const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filename = `${timestamp}-${safeFilename}`;
    const filepath = path.join(this.uploadDir, filename);

    await fs.promises.writeFile(filepath, file.buffer);

    const url = `/uploads/${filename}`;
    this.logger.debug(`[OFFLINE] Fichier stocké localement: ${url}`);
    return url;
  }

  /**
   * Supprime un fichier local
   * @param publicId URL locale ou nom de fichier (ex: /uploads/filename.jpg)
   */
  async delete(publicId: string, _type: 'image' | 'video' = 'image'): Promise<void> {
    // Extraire le nom de fichier de l'URL
    const filename = publicId.replace('/uploads/', '');
    const filepath = path.join(this.uploadDir, filename);

    try {
      await fs.promises.unlink(filepath);
      this.logger.debug(`[OFFLINE] Fichier supprimé: ${filepath}`);
    } catch {
      // Ignorer si le fichier n'existe plus (idempotent)
      this.logger.debug(`[OFFLINE] Fichier déjà absent: ${filepath}`);
    }
  }
}
