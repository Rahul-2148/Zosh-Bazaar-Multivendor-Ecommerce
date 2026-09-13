import axios from "axios";

interface CloudinaryResponse {
  secure_url: string;
  public_id?: string;
  format?: string;
}

export const uploadToCloudinary = async (
  file: File,
  folder = "products",
  resourceType: "image" | "video" | "raw" = "image"
): Promise<{ secure_url: string }> => {
  const cloud_name = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const upload_preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // If cloud credentials configured, perform genuine Cloudinary upload
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

      return { secure_url: response.data.secure_url };
    } catch (err) {
      console.warn("Cloudinary upload failed, falling back to local base64 preview:", err);
    }
  }

  // Resilient fallback: convert to base64 DataURL for local preview & offline dev
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve({ secure_url: reader.result });
      } else {
        reject(new Error("Failed to convert image to data URL"));
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
