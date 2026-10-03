import { v2 as cloudinary } from "cloudinary";

const getCredentials = () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  apiKey: process.env.CLOUDINARY_API_KEY || "",
  apiSecret: process.env.CLOUDINARY_API_SECRET || "",
});

export const isCloudinaryConfigured = () => {
  const { cloudName, apiKey, apiSecret } = getCredentials();
  return Boolean(cloudName && apiKey && apiSecret);
};

export const ensureCloudinaryConfig = () => {
  const { cloudName, apiKey, apiSecret } = getCredentials();
  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }
};

// Initial config attempt
ensureCloudinaryConfig();

export const getCloudinaryConfig = () => {
  const { cloudName, apiKey } = getCredentials();
  return {
    cloudName,
    apiKey: apiKey ? `${apiKey.slice(0, 4)}****` : "",
    isConfigured: isCloudinaryConfigured(),
  };
};

/**
 * Generate authenticated signed parameters for secure browser-to-Cloudinary upload
 */
export const generateUploadSignature = (paramsToSign = {}) => {
  ensureCloudinaryConfig();
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary credentials are not configured on the server.");
  }

  const { cloudName, apiKey, apiSecret } = getCredentials();
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
  ensureCloudinaryConfig();
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
  ensureCloudinaryConfig();
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
