const CLOUDINARY_CLOUD_NAME = "dp2zwkxoi";
const CLOUDINARY_UPLOAD_PRESET = "aisignalfx_upload";

async function uploadToCloudinary(file, folder = "aisignalfx/uploads"){
  if(!file) return null;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", folder);

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const response = await fetch(endpoint, {
    method: "POST",
    body: formData
  });

  if(!response.ok){
    const text = await response.text();
    throw new Error("Cloudinary upload failed: " + text);
  }

  return await response.json();
}

window.AiSignalCloudinary = {
  cloudName: CLOUDINARY_CLOUD_NAME,
  uploadPreset: CLOUDINARY_UPLOAD_PRESET,
  uploadToCloudinary
};
