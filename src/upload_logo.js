import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const logoPath = path.join(__dirname, "email", "dc_logo.png");

console.log("Uploading logo from:", logoPath);

try {
  const result = await cloudinary.uploader.upload(logoPath, {
    folder: "obams",
    public_id: "dc_logo",
    overwrite: true,
    resource_type: "image",
  });
  console.log("\n✅ Logo uploaded successfully!");
  console.log("URL:", result.secure_url);
  console.log("\nCopy this URL and paste it into your .env as EMAIL_LOGO_URL");
} catch (err) {
  console.error("❌ Upload failed:", err.message);
}
