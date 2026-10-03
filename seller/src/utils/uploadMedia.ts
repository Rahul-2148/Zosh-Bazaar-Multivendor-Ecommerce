import axios from "axios";
import { API_BASE_URL } from "../services/api";

export interface MediaUploadResult {
  secure_url: string;
  public_id?: string;
  format?: string;
  width?: number;
  height?: number;
}

export const uploadMediaFile = async (
  file: File,
  folder = "zosh_bazaar_products"
): Promise<MediaUploadResult> => {
  // 1. Authoritative server upload route (streams to Cloudinary or deterministic storage)
  try {
    const token = localStorage.getItem("seller_jwt") || localStorage.getItem("jwt");
    const formData = new FormData();
    formData.append("image", file);
    formData.append("folder", folder);

    const headers: Record<string, string> = {
      "Content-Type": "multipart/form-data",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const serverRes = await axios.post(`${API_BASE_URL}/seller/upload/cloudinary`, formData, {
      headers,
      withCredentials: true,
    });

    if (serverRes.data?.secure_url) {
      return {
        secure_url: serverRes.data.secure_url,
        public_id: serverRes.data.public_id,
        format: serverRes.data.format,
        width: serverRes.data.width,
        height: serverRes.data.height,
      };
    }
  } catch (serverErr) {
    console.warn("Server upload endpoint error, trying direct upload preset fallback:", serverErr);
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
      data.append("folder", folder);

      const response = await axios.post(url, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return {
        secure_url: response.data.secure_url,
        public_id: response.data.public_id,
        format: response.data.format,
      };
    } catch (err) {
      console.warn("Direct Cloudinary upload failed:", err);
    }
  }

  throw new Error("Unable to upload image. Please verify server connectivity or Cloudinary credentials.");
};

export const uploadMultipleMedia = async (
  files: File[],
  folder = "zosh_bazaar_products",
  onProgress?: (current: number, total: number) => void
): Promise<string[]> => {
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const res = await uploadMediaFile(files[i], folder);
    urls.push(res.secure_url);
    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }
  return urls;
};
