import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CloudinaryService } from './claudinary.service';
import { LocalFileService } from '../storage/local-file.service';
import { FileUploaderName } from './file-upload.interface';

/**
 * CloudinaryModule — Dual Provider
 *
 * - Mode cloud (PostgreSQL)  → CloudinaryService (upload Cloudinary)
 * - Mode offline (SQLite)    → LocalFileService (stockage ./uploads/)
 *
 * La sélection est automatique selon DATABASE_PROVIDER.
 * Le token FileUploaderName reste identique pour tous les consommateurs.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    CloudinaryService,
    LocalFileService,
    {
      provide: FileUploaderName,
      useFactory: (configService: ConfigService) => {
        const isOffline = configService.get<string>('DATABASE_PROVIDER') === 'sqlite';

        if (isOffline) {
          // Mode offline : stockage local dans ./uploads/
          return new LocalFileService();
        }

        // Mode cloud : upload vers Cloudinary
        return new CloudinaryService();
      },
      inject: [ConfigService],
    },
  ],
  exports: [FileUploaderName, CloudinaryService, LocalFileService],
})
export class CloudinaryModule {}
