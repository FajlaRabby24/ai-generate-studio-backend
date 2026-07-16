import cloudinary from "../../config/cloudinary.config";

const CloudinaryImageUpload = async (image: string) => {
  const uploadResponse = await cloudinary.uploader.upload(image, {
    folder: "AI Generate Studio/Image History",
    resource_type: "image",
  });

  return {
    format: uploadResponse.format,
    resourceType: uploadResponse.resource_type,
    publicId: uploadResponse.public_id,
    secureUrl: uploadResponse.secure_url,
    createdAt: uploadResponse.created_at,
  };
};

export default CloudinaryImageUpload;
