import apiClient from "../api/apiClient";

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id?: string;
  format?: string;
  width?: number;
  height?: number;
}

/**
 * Authoritative Admin Media Upload
 * Protected admin catalogue assets are strictly uploaded through
 * POST /api/v1/admin/upload/cloudinary via apiClient (with admin JWT).
 */
export const uploadToCloudinary = async (
  file: File,
  folder = "products"
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("folder", folder);

    const response = await apiClient.post("/admin/upload/cloudinary", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const item = response.data?.data?.[0];
    const secureUrl = response.data?.secure_url || item?.secureUrl || item?.url;

    if (secureUrl) {
      return secureUrl;
    }

    throw new Error(response.data?.message || "Invalid server response");
  } catch (err: any) {
    const message =
      err.response?.data?.message ||
      err.message ||
      "Unable to upload product image. Please verify administrator session or connectivity.";
    console.error("[Admin Media Upload] Failure:", message);
    throw new Error(message);
  }
};

export const uploadMultipleFiles = async (
  files: File[],
  folder = "products",
  onProgress?: (current: number, total: number) => void
): Promise<string[]> => {
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const url = await uploadToCloudinary(files[i], folder);
    urls.push(url);
    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }
  return urls;
};
