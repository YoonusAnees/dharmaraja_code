import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload an image file."), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const processImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const filename = `image-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    const outputPath = path.join(uploadsDir, filename);

    await sharp(req.file.buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);

    req.file.filename = filename;
    req.file.path = `/uploads/${filename}`;
    
    next();
  } catch (error) {
    console.error("Image processing error:", error);
    next(error);
  }
};