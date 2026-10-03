import axios from "axios";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/v1";

/**
 * Authoritative Backend Media Upload
 * Protected persistent marketplace media is strictly uploaded through the authenticated
 * Zosh Bazaar backend endpoint (POST /api/v1/upload/cloudinary).
 * Server credentials, MIME validation, file-size limits, and namespace ownership are enforced server-side.
 */
export const uploadToCloudinary = async (
  file: File,
  folder = "products",
  _resourceType: "image" | "video" | "raw" = "image"
): Promise<{ secure_url: string; public_id?: string }> => {
  try {
    const formData = new FormData();
    formData.append("images", file);
    formData.append("folderType", folder.includes("/") ? folder.split("/")[0] : folder);

    const token = localStorage.getItem("jwt");
    const headers: Record<string, string> = {
      "Content-Type": "multipart/form-data",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const serverRes = await axios.post(`${API_BASE_URL}/upload/cloudinary`, formData, {
      headers,
    });

    const item = serverRes.data?.data?.[0];
    const secureUrl = item?.secureUrl || item?.url || serverRes.data?.secure_url || serverRes.data?.url;

    if (secureUrl) {
      return {
        secure_url: secureUrl,
        public_id: item?.publicId || serverRes.data?.public_id,
      };
    }

    throw new Error(serverRes.data?.message || "Invalid response from upload service");
  } catch (err: any) {
    const message =
      err.response?.data?.message ||
      err.message ||
      "Media upload failed. Please verify network or authentication.";
    console.error("[Upload] Backend upload error:", message);
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
    const res = await uploadToCloudinary(files[i], folder);
    urls.push(res.secure_url);
    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }
  return urls;
};
