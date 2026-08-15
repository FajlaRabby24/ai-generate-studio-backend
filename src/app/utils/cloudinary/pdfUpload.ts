import cloudinary from "../../config/cloudinary.config";
import { envVars } from "../../config/env";

export const PDFUploadToCloudinary = async (
  pdfBuffer: Buffer,
  name: string,
) => {
  const uploadResponse = await new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "AI Generate Studio/Resumes",
        resource_type: "raw", // ⚠️ "auto"-এর জায়গায় অবশ্যই "raw" ব্যবহার করুন
        public_id: `${name}_resume_${Date.now()}.pdf`, // ⚠️ ফাইলের নাম ও .pdf এক্সটেনশন নিশ্চিত করার জন্য
        upload_preset: envVars.CLOUDINARY_UPLOAD_PRESET,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
    uploadStream.end(pdfBuffer);
  });

  if (!uploadResponse?.secure_url) {
    throw new Error("Failed to upload generated PDF to Cloudinary.");
  }

  return uploadResponse.secure_url;
};
