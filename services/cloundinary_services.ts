import * as VideoThumbnails from "expo-video-thumbnails";

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || "dh9yyhavk";
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "react_native";

type MediaType = "image" | "video";

// ─────────────────────────────────────────────────
// Generate Video Thumbnail
// ─────────────────────────────────────────────────
export const generateVideoThumbnail = async (
  videoUri: string,
  timeMs: number = 1000
): Promise<{ uri: string | null; error: string | null }> => {
  try {
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
      time: timeMs,
      quality: 0.8,
    });
    return { uri, error: null };
  } catch (error: any) {
    console.log("Thumbnail generation error:", error);
    return { uri: null, error: error.message || "Failed to generate thumbnail" };
  }
};

interface UploadResult {
  url: string | null;
  error: string | null;
}

// ─────────────────────────────────────────────────
// Upload with Progress Callback (using XMLHttpRequest)
// ─────────────────────────────────────────────────
export const uploadMediaToCloudinary = async (
  mediaUri: string,
  mediaType: MediaType = "image",
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  return new Promise((resolve) => {
    try {
      const formData = new FormData();

      const fileExtension = mediaType === "video" ? "mp4" : "jpg";
      const mimeType = mediaType === "video" ? "video/mp4" : "image/jpeg";

      formData.append("file", {
        uri: mediaUri,
        type: mimeType,
        name: `upload.${fileExtension}`,
      } as any);

      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

      const xhr = new XMLHttpRequest();

      // Progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };

      // Success handler
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.secure_url) {
              resolve({ url: data.secure_url, error: null });
            } else {
              resolve({ url: null, error: "Upload failed - no URL returned" });
            }
          } catch {
            resolve({ url: null, error: "Failed to parse upload response" });
          }
        } else {
          resolve({ url: null, error: `Upload failed with status ${xhr.status}` });
        }
      };

      // Error handler
      xhr.onerror = () => {
        resolve({ url: null, error: "Network error during upload" });
      };

      // Abort handler
      xhr.onabort = () => {
        resolve({ url: null, error: "Upload cancelled" });
      };

      // Configure and send
      const endpoint = mediaType === "video" ? "video" : "image";
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${endpoint}/upload`
      );
      xhr.send(formData);
    } catch (error: any) {
      console.log("Cloudinary upload error:", error);
      resolve({ url: null, error: error.message || "Upload failed" });
    }
  });
};

// ─────────────────────────────────────────────────
// Simple Image Upload (backward compatible)
// ─────────────────────────────────────────────────
export const uploadImageToCloudinary = async (
  imageUri: string
): Promise<string | null> => {
  const result = await uploadMediaToCloudinary(imageUri, "image");
  return result.url;
};

// ─────────────────────────────────────────────────
// Video Upload with Progress
// ─────────────────────────────────────────────────
export const uploadVideoToCloudinary = async (
  videoUri: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  return uploadMediaToCloudinary(videoUri, "video", onProgress);
};

// ─────────────────────────────────────────────────
// Create cancellable upload
// ─────────────────────────────────────────────────
export interface CancellableUpload {
  promise: Promise<UploadResult>;
  cancel: () => void;
}

export const createCancellableUpload = (
  mediaUri: string,
  mediaType: MediaType = "image",
  onProgress?: (progress: number) => void
): CancellableUpload => {
  let xhr: XMLHttpRequest | null = null;

  const promise = new Promise<UploadResult>((resolve) => {
    try {
      const formData = new FormData();

      const fileExtension = mediaType === "video" ? "mp4" : "jpg";
      const mimeType = mediaType === "video" ? "video/mp4" : "image/jpeg";

      formData.append("file", {
        uri: mediaUri,
        type: mimeType,
        name: `upload.${fileExtension}`,
      } as any);

      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

      xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr && xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.secure_url) {
              resolve({ url: data.secure_url, error: null });
            } else {
              resolve({ url: null, error: "Upload failed - no URL returned" });
            }
          } catch {
            resolve({ url: null, error: "Failed to parse upload response" });
          }
        } else {
          resolve({ url: null, error: `Upload failed with status ${xhr?.status}` });
        }
      };

      xhr.onerror = () => {
        resolve({ url: null, error: "Network error during upload" });
      };

      xhr.onabort = () => {
        resolve({ url: null, error: "Upload cancelled" });
      };

      const endpoint = mediaType === "video" ? "video" : "image";
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${endpoint}/upload`
      );
      xhr.send(formData);
    } catch (error: any) {
      resolve({ url: null, error: error.message || "Upload failed" });
    }
  });

  return {
    promise,
    cancel: () => {
      if (xhr) {
        xhr.abort();
      }
    },
  };
};
