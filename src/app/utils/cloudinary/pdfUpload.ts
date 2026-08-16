import cloudinary from "../../config/cloudinary.config";
import { envVars } from "../../config/env";

export const PDFUploadToCloudinary = async (
  pdfBuffer: Buffer,
  name: string,
) => {
  try {
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

    // return uploadResponse.secure_url;

    return {
      success: true,
      message: "PDF uploaded successfully",
      format: uploadResponse.format,
      resourceType: uploadResponse.resource_type,
      publicId: uploadResponse.public_id,
      secureUrl: uploadResponse.secure_url,
      createdAt: uploadResponse.created_at,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to upload generated PDF to Cloudinary.",
    };
  }
};
