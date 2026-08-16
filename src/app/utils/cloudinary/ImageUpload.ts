import cloudinary from "../../config/cloudinary.config";

const CloudinaryImageUpload = async (image: string | Buffer) => {
  if (!image) {
    return {
      success: false,
      message: "Image is required",
    };
  }

  try {
    let uploadResponse;

    // ১. যদি ইমেজটি একটি Buffer হয় (Stream Upload)
    if (Buffer.isBuffer(image)) {
      uploadResponse = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "AI Generate Studio/Image History",
            resource_type: "image",
            format: "png", // ব্যাকগ্রাউন্ড রিমুভড ইমেজের ট্রান্সপারেন্সি ধরে রাখার জন্য
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        );
        uploadStream.end(image);
      });
    }
    // ২. যদি ইমেজটি Base64 String বা URL হয়
    else {
      uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "AI Generate Studio/Image History",
        resource_type: "image",
      });
    }

    return {
      success: true,
      message: "Image uploaded successfully",
      format: uploadResponse.format,
      resourceType: uploadResponse.resource_type,
      publicId: uploadResponse.public_id,
      secureUrl: uploadResponse.secure_url,
      createdAt: uploadResponse.created_at,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to upload image to Cloudinary",
    };
  }
};

export default CloudinaryImageUpload;
