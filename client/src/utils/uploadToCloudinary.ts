import axios from "axios";

interface CloudinaryResponse {
  secure_url: string;
  public_id?: string;
  format?: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/v1";

/**
 * P0 — Authoritative Cloudinary Upload (Section 17 & 18)
 * Uploads via server authorization endpoint or secure unsigned preset.
 * Strictly eliminates silent base64 fallbacks in production.
 */
export const uploadToCloudinary = async (
  file: File,
  folder = "products",
  resourceType: "image" | "video" | "raw" = "image"
): Promise<{ secure_url: string; public_id?: string }> => {
  const cloud_name = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const upload_preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // 1. Direct Cloudinary upload if valid unsigned preset is provided
  if (cloud_name && upload_preset) {
    try {
      const url = `https://api.cloudinary.com/v1_1/${cloud_name}/${resourceType}/upload`;
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", upload_preset);
      data.append("cloud_name", cloud_name);
      data.append("folder", folder);

      const response = await axios.post<CloudinaryResponse>(url, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.secure_url) {
        return {
          secure_url: response.data.secure_url,
          public_id: response.data.public_id,
        };
      }
    } catch (err: any) {
      console.warn(
        "[Upload] Direct Cloudinary preset failed, attempting backend server upload:",
        err.message
      );
    }
  }

  // 2. Authoritative backend server upload (server uses server-only CLOUDINARY_API_SECRET)
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

    if (serverRes.data?.data?.[0]?.url || serverRes.data?.data?.[0]?.secureUrl) {
      const item = serverRes.data.data[0];
      return {
        secure_url: item.secureUrl || item.url,
        public_id: item.publicId,
      };
    }
  } catch (serverErr: any) {
    console.warn("[Upload] Backend server upload failed:", serverErr.message);
  }

  // 3. Section 17: In production, upload failure MUST throw error, never silently fall back to base64
  if (!import.meta.env.DEV) {
    throw new Error(
      "Image upload failed: Storage service is unavailable. Please verify network or Cloudinary configuration."
    );
  }

  // Development-only offline preview fallback with explicit console warning
  console.warn(
    "⚠️ [Dev Mock Upload] Development offline preview fallback active. This will NOT be permitted in production builds."
  );
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve({ secure_url: reader.result });
      } else {
        reject(new Error("Failed to generate preview data URL"));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
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
