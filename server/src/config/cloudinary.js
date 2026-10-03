import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
const apiKey = process.env.CLOUDINARY_API_KEY || "";
const apiSecret = process.env.CLOUDINARY_API_SECRET || "";

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export const isCloudinaryConfigured = () => {
  return Boolean(cloudName && apiKey && apiSecret);
};

export const getCloudinaryConfig = () => ({
  cloudName,
  apiKey: apiKey ? `${apiKey.slice(0, 4)}****` : "",
  isConfigured: isCloudinaryConfigured(),
});

/**
 * Generate authenticated signed parameters for secure browser-to-Cloudinary upload
 */
export const generateUploadSignature = (paramsToSign = {}) => {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary credentials are not configured on the server.");
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const signingParams = {
    timestamp,
    ...paramsToSign,
  };

  const signature = cloudinary.utils.api_sign_request(signingParams, apiSecret);

  return {
    signature,
    timestamp,
    apiKey,
    cloudName,
  };
};

/**
 * Upload a memory buffer directly to Cloudinary
 */
export const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      return reject(new Error("Cloudinary is not configured."));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: options.resourceType || "image",
        folder: options.folder || "zosh-bazaar/products",
        tags: options.tags || ["zosh-bazaar"],
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url || result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          resourceType: result.resource_type,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        });
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Remove an asset from Cloudinary by public ID
 */
export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  if (!isCloudinaryConfigured() || !publicId) return false;
  try {
    const res = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return res.result === "ok";
  } catch (err) {
    console.error(`[Cloudinary] Failed to delete asset ${publicId}:`, err.message);
    return false;
  }
};

export default cloudinary;
