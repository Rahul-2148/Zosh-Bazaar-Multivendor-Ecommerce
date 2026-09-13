import axios from "axios";

interface CloudinaryResponse {
  secure_url: string;
  public_id?: string;
  format?: string;
}

export const uploadMediaFile = async (
  file: File,
  folder = "zosh_bazaar_products"
): Promise<{ secure_url: string }> => {
  const cloud_name = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const upload_preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (cloud_name && upload_preset) {
    try {
      const url = `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`;
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", upload_preset);
      data.append("folder", folder);

      const response = await axios.post<CloudinaryResponse>(url, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return { secure_url: response.data.secure_url };
    } catch (err) {
      console.warn("Cloudinary upload failed, falling back to local base64 preview:", err);
    }
  }

  // Resilient fallback to base64 DataURL for local development / testing
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve({ secure_url: reader.result });
      } else {
        reject(new Error("Failed to read image"));
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
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
