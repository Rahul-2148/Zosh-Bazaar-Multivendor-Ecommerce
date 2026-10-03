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
  // Authoritative server upload route (POST /api/v1/seller/upload/cloudinary)
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

    const item = serverRes.data?.data?.[0];
    const secureUrl = serverRes.data?.secure_url || item?.secureUrl || item?.url;

    if (secureUrl) {
      return {
        secure_url: secureUrl,
        public_id: serverRes.data?.public_id || item?.publicId,
        format: serverRes.data?.format || item?.format,
        width: serverRes.data?.width || item?.width,
        height: serverRes.data?.height || item?.height,
      };
    }

    throw new Error(serverRes.data?.message || "Invalid server response");
  } catch (serverErr: any) {
    const message =
      serverErr.response?.data?.message ||
      serverErr.message ||
      "Unable to upload media. Please verify server connectivity or authentication.";
    console.error("[Seller Media Upload] Failure:", message);
    throw new Error(message);
  }
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
