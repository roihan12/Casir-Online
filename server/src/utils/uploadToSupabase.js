const { ResponseError } = require("../error/responseError");
const path = require("path");
const { supabase,bucketName } = require("../config/supabase");

const uploadFileToSupabase = async (file) => {
  const timestamp = Date.now();
  const fileExt = path.extname(file.originalname);
  const fileName = `${timestamp}-${file.originalname.replace(/\s+/g, "-")}`;
  const filePath = `products/${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) {
    throw new ResponseError(400, `Error uploading file: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    filename: fileName,
  };
};

/**
 * Upload a Buffer directly to Supabase (for attendance photos)
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Storage folder (default: "absensi")
 * @returns {Promise<string>} Public URL of the uploaded file
 */
const uploadBufferToSupabase = async (buffer, folder = "absensi") => {
  const timestamp = Date.now();
  const fileName = `${timestamp}-attendance.jpg`;
  const filePath = `${folder}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, buffer, {
      contentType: "image/jpeg",
    });

  if (error) {
    throw new ResponseError(400, `Error uploading file: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
};

const deleteFilesFromSupabase = async (filePaths) => {
  if (!filePaths || filePaths.length === 0) return;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .remove(filePaths);

  if (error) {
    console.error("Error deleting files from Supabase:", error);
    throw new Error(`Error deleting files from Supabase: ${error.message}`);
  }

  return data;
};

module.exports = { uploadFileToSupabase, uploadBufferToSupabase, deleteFilesFromSupabase };
