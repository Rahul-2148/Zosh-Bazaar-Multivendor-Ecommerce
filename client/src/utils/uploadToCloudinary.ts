import axios from "axios";

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
  bytes: number;
  created_at: string;
}

export const uploadToCloudinary = async (
  file: File,
  folder: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<CloudinaryResponse> => {
  try {
    const cloud_name = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const upload_preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    const url = `https://api.cloudinary.com/v1_1/${cloud_name}/${resourceType}/upload`;

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", upload_preset);
    data.append("cloud_name", cloud_name);
    data.append("folder", folder);

    const response = await axios.post(url, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // console.log(`Cloudinary response for ${resourceType}:`, response.data);
    return response.data as CloudinaryResponse;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};
