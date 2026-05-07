import { Module } from '@nestjs/common';
import { CloudinaryService } from './claudinary.service';
import { FileUploaderName } from './file-upload.interface';

@Module({
  providers: [
    CloudinaryService,
    {
      provide: FileUploaderName,
      useClass: CloudinaryService,
    },
  ],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
