import apiClient from "../api/apiClient";
import axios from "axios";

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id?: string;
  format?: string;
  width?: number;
  height?: number;
}

export const uploadToCloudinary = async (
  file: File,
  folder = "products"
): Promise<string> => {
  // 1. Authoritative server upload route (streams to Cloudinary or deterministic storage)
  try {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("folder", folder);

    const response = await apiClient.post("/admin/upload/cloudinary", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (response.data?.secure_url) {
      return response.data.secure_url;
    }
  } catch (err) {
    console.warn("Admin server upload failed, attempting direct Cloudinary fallback:", err);
  }

  // 2. Direct Cloudinary upload preset fallback
  const cloud_name = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const upload_preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (cloud_name && upload_preset) {
    try {
      const url = `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`;
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", upload_preset);
      data.append("cloud_name", cloud_name);
      data.append("folder", folder);

      const response = await axios.post<{ secure_url: string }>(url, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return response.data.secure_url;
    } catch (err) {
      console.warn("Direct Cloudinary upload failed:", err);
    }
  }

  throw new Error("Unable to upload product image. Please verify server connectivity or Cloudinary credentials.");
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
