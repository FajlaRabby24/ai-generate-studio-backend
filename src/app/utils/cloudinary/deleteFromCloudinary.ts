import cloudinary from "../../config/cloudinary.config";

const DeleteFromCloudinary = async (publicId: string, resourceType: string) => {
  if (!publicId || !resourceType) {
    return {
      success: false,
      message: "Public ID and Resource Type are required",
    };
  }

  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });

  return {
    success: true,
    message: `${resourceType} deleted successfully`,
  };
};

export default DeleteFromCloudinary;
