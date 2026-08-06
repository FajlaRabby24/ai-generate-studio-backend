import cloudinary from "../../config/cloudinary.config";

export const PDFUploadToCloudinary = async (pdfBuffer: Buffer) => {
  const uploadResponse = await new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "AI Generate Studio/Resumes",
        resource_type: "image",
        format: "pdf",
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
