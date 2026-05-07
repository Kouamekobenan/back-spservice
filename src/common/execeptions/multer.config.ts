import { BadRequestException } from "@nestjs/common";

// ✅ Multer config avec validation
export const multerOptions = {
  limits: {
    fileSize: 2 * 1024 * 1024, // Max 2 Mo
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /\/(jpg|jpeg|png)$/;
    if (!file.mimetype.match(allowedTypes)) {
      return cb(
        new BadRequestException(
          "❌ Seules les images JPG, JPEG, PNG sont autorisées.",
        ),
        false,
      );
    }
    cb(null, true);
  },
};